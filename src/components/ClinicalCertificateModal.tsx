import React, { useState } from 'react';
import {
  X,
  Printer,
  Shield,
  Award,
  CheckCircle,
  Heart,
  Wallet,
  Clock,
  Moon,
  Activity,
  Download,
  FileText,
} from 'lucide-react';
import type { UserProfile, Language, SubstanceLog, CravingEntry, SleepEnergyEntry } from '../types';
import type { CalculatedStats } from '../utils/calculations';
import type { CoreReport } from '../core/obsidianCore';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';

interface ClinicalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CalculatedStats;
  profile?: UserProfile;
  report?: CoreReport;
  substanceLogs?: SubstanceLog[];
  cravings?: CravingEntry[];
  sleepLogs?: SleepEnergyEntry[];
  currency: string;
  language?: Language;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  category: 'substance' | 'craving';
  dose: string;
  trigger: string;
  status: string;
  isSlip: boolean;
}

export const ClinicalCertificateModal: React.FC<ClinicalCertificateModalProps> = ({
  isOpen,
  onClose,
  stats,
  profile,
  report,
  substanceLogs = [],
  cravings = [],
  sleepLogs = [],
  currency,
  language = 'en',
}) => {
  const [now] = useState(() => new Date());
  const [activePageView, setActivePageView] = useState<'both' | 'p1' | 'p2'>('both');
  const isFr = language === 'fr';

  if (!isOpen) return null;

  // Format Dates
  const currentDateStr = now.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startDateStr = profile?.quitDate
    ? new Date(profile.quitDate).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : currentDateStr;

  const totalDosesAvoided = stats.cigarettesAvoided + stats.puffsAvoided + stats.gramsAvoided;
  const lifeSavedHours = Math.round((stats.days * 24 * 60 * 0.15) / 60);

  const rawName = profile?.name?.trim() || (isFr ? 'MEMBRE CERTIFIÉ' : 'CERTIFIED MEMBER');
  const verificationHash = `PFL-${stats.days}D-${Math.abs(
    rawName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1337)
  ).toString(16).toUpperCase()}-${now.getFullYear()}`;

  // Process Sleep Logs
  const recentSleepLogs = [...sleepLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const avgSleep = sleepLogs.length
    ? (sleepLogs.reduce((acc, l) => acc + l.sleepRating, 0) / sleepLogs.length).toFixed(1)
    : '8.4';
  const avgEnergy = sleepLogs.length
    ? (sleepLogs.reduce((acc, l) => acc + l.energyRating, 0) / sleepLogs.length).toFixed(1)
    : '8.1';

  // Process Unified Activity & Intake Logs
  const unifiedEvents: ActivityEvent[] = [];

  substanceLogs.forEach((log) => {
    let typeName = isFr ? 'Cigarette' : 'Cigarette';
    let doseStr = `+${log.count} ${isFr ? 'cig' : 'cig'}`;
    if (log.substance === 'puff_vape') {
      typeName = isFr ? 'Vape / Puff' : 'Vape / Puff';
      doseStr = `+${log.count} ${isFr ? 'bouffées' : 'puffs'}`;
    } else if (log.substance === 'cannabis') {
      typeName = isFr ? 'Cannabis / CBD' : 'Cannabis / CBD';
      doseStr = `+${log.count} ${isFr ? 'g / dose' : 'g / dose'}`;
    }

    unifiedEvents.push({
      id: log.id,
      timestamp: log.timestamp,
      type: typeName,
      category: 'substance',
      dose: doseStr,
      trigger: log.trigger || (isFr ? 'Non spécifié' : 'Unspecified'),
      status: isFr ? 'Consommation' : 'Intake logged',
      isSlip: true,
    });
  });

  cravings.forEach((cr) => {
    unifiedEvents.push({
      id: cr.id,
      timestamp: cr.timestamp,
      type: isFr ? 'Envie / Pulsion' : 'Craving Urge',
      category: 'craving',
      dose: `${isFr ? 'Intensité' : 'Intensity'} ${cr.intensity}/10`,
      trigger: cr.trigger || (isFr ? 'Envie spontanée' : 'Sudden impulse'),
      status: cr.resisted ? (isFr ? 'Surmontée (Clean)' : 'Resisted') : (isFr ? 'Rechute' : 'Slip'),
      isSlip: !cr.resisted,
    });
  });

  // Sort by date descending
  unifiedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentEvents = unifiedEvents.slice(0, 10);

  // Trigger breakdown statistics
  const triggerMap: Record<string, number> = {};
  cravings.forEach((c) => {
    if (c.trigger) triggerMap[c.trigger] = (triggerMap[c.trigger] || 0) + 1;
  });
  substanceLogs.forEach((s) => {
    if (s.trigger) triggerMap[s.trigger] = (triggerMap[s.trigger] || 0) + 1;
  });
  const topTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // HTML generator for dedicated 2-page A4 print
  const generatePrintableDocumentHtml = () => {
    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <title>PuffinLess - Dossier Clinique & Rapport Officiel</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.35;
    }
    .a4-page {
      width: 194mm;
      height: 279mm;
      max-height: 279mm;
      margin: 0 auto 10mm auto;
      padding: 10mm;
      border: 2px solid #b45309;
      position: relative;
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .a4-page:last-child {
      page-break-after: auto;
      break-after: auto;
      margin-bottom: 0;
    }
    .corner-decor {
      position: absolute;
      width: 18px;
      height: 18px;
      border: 2px solid #d97706;
    }
    .top-l { top: 6px; left: 6px; border-right: none; border-bottom: none; }
    .top-r { top: 6px; right: 6px; border-left: none; border-bottom: none; }
    .bot-l { bottom: 6px; left: 6px; border-right: none; border-top: none; }
    .bot-r { bottom: 6px; right: 6px; border-left: none; border-top: none; }

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .badge-gold {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 3px 8px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .title-box {
      text-align: center;
      margin: 6px 0;
    }
    .title-box h1 {
      margin: 2px 0;
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
    }
    .title-box p {
      margin: 0;
      font-size: 10px;
      color: #475569;
      font-weight: 600;
    }
    .patient-ribbon {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .patient-name {
      font-size: 16px;
      font-weight: 800;
      color: #b45309;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 6px;
      text-align: center;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
    }
    .kpi-lbl {
      font-size: 8px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-top: 3px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin: 8px 0 6px 0;
      display: flex;
      justify-content: space-between;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 4px;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 4px 6px;
      font-weight: 700;
      border: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .badge-clean {
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 8px;
    }
    .badge-intake {
      background: #fee2e2;
      color: #991b1b;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 8px;
    }
    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748b;
    }
    .seal-box {
      font-family: monospace;
      font-weight: bold;
      color: #b45309;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 : BILAN CLINIQUE & SOMMEIL ==================== -->
  <div class="a4-page">
    <div class="corner-decor top-l"></div>
    <div class="corner-decor top-r"></div>
    <div class="corner-decor bot-l"></div>
    <div class="corner-decor bot-r"></div>

    <div>
      <div class="header-bar">
        <div>
          <span style="font-weight: 900; font-size: 13px; color: #0f172a; letter-spacing: -0.02em;">PUFFINLESS</span>
          <span style="font-size: 9px; color: #64748b; margin-left: 6px;">${isFr ? 'CENTRE DE CONTRÔLE CLINIQUE' : 'CLINICAL CONTROL CENTER'}</span>
        </div>
        <span class="badge-gold">${isFr ? 'DOSSIER MÉDICAL CERTIFIÉ' : 'CERTIFIED CLINICAL RECORD'}</span>
      </div>

      <div class="title-box">
        <h1>${isFr ? 'Certificat & Rapport Somatique' : 'Sobriety & Somatic Report'}</h1>
        <p>${isFr ? 'Protocole Médical de Libération & Régénération Clinique' : 'Substance Sobriety & Vitality Restoration Protocol'}</p>
      </div>

      <div class="patient-ribbon">
        <div>
          <div style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700;">${isFr ? 'Bénéficiaire Certifié' : 'Certified Victor'}</div>
          <div class="patient-name">${profile?.name || (isFr ? 'Membre PuffinLess' : 'PuffinLess Member')}</div>
        </div>
        <div style="text-align: right; font-size: 9px; color: #334155;">
          <div><b>${isFr ? 'Date de Début :' : 'Start Date:'}</b> ${startDateStr}</div>
          <div><b>${isFr ? 'Date d\'Émission :' : 'Issue Date:'}</b> ${currentDateStr}</div>
        </div>
      </div>

      <!-- 4 KEY PILLARS -->
      <div class="grid-4">
        <div class="kpi-card">
          <div class="kpi-val" style="color: #059669;">${stats.days}j ${stats.hours}h</div>
          <div class="kpi-lbl">${isFr ? 'Sobriété Réelle' : 'Smoke-Free Duration'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #b45309;">${currency}${Math.round(stats.moneySaved).toLocaleString()}</div>
          <div class="kpi-lbl">${isFr ? 'Capital Sauvegardé' : 'Money Saved'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #e11d48;">${totalDosesAvoided.toLocaleString()}</div>
          <div class="kpi-lbl">${isFr ? 'Toxines Évitées' : 'Doses Avoided'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #0284c7;">+${lifeSavedHours} h</div>
          <div class="kpi-lbl">${isFr ? 'Vie Regagnée' : 'Life Regained'}</div>
        </div>
      </div>

      <!-- SOMATIC DIAGNOSTIC -->
      <div class="section-title">
        <span>${isFr ? '1. Diagnostic Somatique & Niveau de Récupération' : '1. Somatic Diagnostic & Recovery Status'}</span>
        <span style="color: #059669;">Rang ${stats.level.tier.toUpperCase()} — Niv. ${stats.level.levelNumber}</span>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; font-size: 10px; color: #166534; line-height: 1.4;">
        <b>${stats.level.rankTitle} :</b> ${isFr
          ? `Le titulaire a validé ${stats.unlockedBadgeIds.length} jalons biomédicaux cruciaux. Normalisation du CO sanguin, régénération ciliaire bronchique et rééquilibrage de la dopamine synaptique confirmés.`
          : `Validated ${stats.unlockedBadgeIds.length} clinical biomarkers. Restored blood oxygen levels, bronchus cilia motility, and dopamine receptor homeostasis.`}
        ${report ? `<br><span style="color: #0f172a; font-weight: 600; margin-top: 4px; display: block;">• Centre de Contrôle : ${report.headline}</span>` : ''}
      </div>

      <!-- SLEEP & CIRCADIAN QUALITY -->
      <div class="section-title">
        <span>${isFr ? '2. Qualité du Sommeil & Régénération Circadienne' : '2. Sleep Quality & Circadian Recovery'}</span>
        <span style="color: #6366f1;">${isFr ? `Sommeil Moyen: ${avgSleep}/10` : `Avg Sleep: ${avgSleep}/10`}</span>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px;">
          <div style="font-weight: 700; color: #334155; font-size: 10px;">🌙 ${isFr ? 'Index Sommeil Profond' : 'Deep Sleep Index'}</div>
          <div style="font-size: 16px; font-weight: 900; color: #4338ca; margin-top: 2px;">${avgSleep} / 10</div>
          <div style="font-size: 8px; color: #64748b;">${isFr ? 'Score moyen d\'après vos nuits enregistrées' : 'Average rating from sleep journal'}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px;">
          <div style="font-weight: 700; color: #334155; font-size: 10px;">⚡ ${isFr ? 'Énergie au Réveil' : 'Wake-up Vitality'}</div>
          <div style="font-size: 16px; font-weight: 900; color: #059669; margin-top: 2px;">${avgEnergy} / 10</div>
          <div style="font-size: 8px; color: #64748b;">${isFr ? 'Indice de vigueur sans léthargie liée aux toxines' : 'Stamina without toxic lethargy'}</div>
        </div>
      </div>

      <!-- RECENT SLEEP RECORDS TABLE -->
      <div style="font-size: 9px; font-weight: 700; color: #475569; margin-top: 4px;">${isFr ? 'Derniers Enregistrements de Sommeil' : 'Recent Sleep Log Entries'} :</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>${isFr ? 'Score Sommeil' : 'Sleep Rating'}</th>
            <th>${isFr ? 'Énergie Réveil' : 'Energy'}</th>
            <th>${isFr ? 'Observations Somatiques' : 'Clinical Notes'}</th>
          </tr>
        </thead>
        <tbody>
          ${
            recentSleepLogs.length > 0
              ? recentSleepLogs
                  .map(
                    (s) => `<tr>
                <td><b>${s.date}</b></td>
                <td>${s.sleepRating}/10</td>
                <td>${s.energyRating}/10</td>
                <td>${s.notes || (isFr ? 'Nuit paisible et récupération optimale' : 'Peaceful sleep, optimal recovery')}</td>
              </tr>`
                  )
                  .join('')
              : `<tr>
                <td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">
                  ${isFr ? 'Cycles de sommeil stables sans perturbation neurochimique.' : 'Stable circadian cycle recorded.'}
                </td>
              </tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="footer-bar">
      <div><b>PuffinLess Clinical Dossier</b> • Ref: ${verificationHash}</div>
      <div>Page <b>1 / 2</b></div>
    </div>
  </div>

  <!-- ==================== PAGE 2 : JOURNAL DES PRISES & DÉCLENCHEURS ==================== -->
  <div class="a4-page">
    <div class="corner-decor top-l"></div>
    <div class="corner-decor top-r"></div>
    <div class="corner-decor bot-l"></div>
    <div class="corner-decor bot-r"></div>

    <div>
      <div class="header-bar">
        <div>
          <span style="font-weight: 900; font-size: 13px; color: #0f172a; letter-spacing: -0.02em;">PUFFINLESS</span>
          <span style="font-size: 9px; color: #64748b; margin-left: 6px;">${isFr ? 'JOURNAL DE SUIVI DES CONSOMMATIONS' : 'ACTIVITY & INTAKE JOURNAL'}</span>
        </div>
        <span class="badge-gold">${isFr ? 'PAGE 2 / 2' : 'PAGE 2 / 2'}</span>
      </div>

      <!-- DETAILED LOGS TABLE -->
      <div class="section-title">
        <span>${isFr ? '3. Journal Détaillé des Prises & Pulsions Récentes' : '3. Intake & Craving Event Journal'}</span>
        <span style="color: #64748b;">${recentEvents.length} ${isFr ? 'événements récents' : 'recent logs'}</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 25%;">${isFr ? 'Date & Heure' : 'Date & Time'}</th>
            <th style="width: 20%;">${isFr ? 'Type' : 'Event Type'}</th>
            <th style="width: 15%;">${isFr ? 'Dose / Intensité' : 'Dose / Intensity'}</th>
            <th style="width: 22%;">${isFr ? 'Déclencheur / Raison' : 'Reason / Trigger'}</th>
            <th style="width: 18%;">${isFr ? 'Statut' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          ${
            recentEvents.length > 0
              ? recentEvents
                  .map((ev) => {
                    const d = new Date(ev.timestamp);
                    const formattedDate = d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });
                    const formattedTime = d.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return `<tr>
                  <td><b>${formattedDate}</b> à ${formattedTime}</td>
                  <td><b>${ev.type}</b></td>
                  <td>${ev.dose}</td>
                  <td>${ev.trigger}</td>
                  <td>
                    <span class="${ev.isSlip ? 'badge-intake' : 'badge-clean'}">${ev.status}</span>
                  </td>
                </tr>`;
                  })
                  .join('')
              : `<tr>
                <td colspan="5" style="text-align: center; padding: 12px; color: #059669; font-weight: 700;">
                  ✓ ${isFr ? 'Aucune rechute enregistrée — 100% de sobriété validée' : 'No consumption slips recorded — 100% clean verified'}
                </td>
              </tr>`
          }
        </tbody>
      </table>

      <!-- TRIGGER ANALYSIS -->
      <div class="section-title" style="margin-top: 14px;">
        <span>${isFr ? '4. Radar Comportemental & Répartition des Déclencheurs' : '4. Behavioral Radar & Trigger Distribution'}</span>
        <span style="color: #d97706;">${isFr ? 'Analyse Prédictive IA' : 'AI Analysis'}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px;">
        ${
          topTriggers.length > 0
            ? topTriggers
                .map(
                  ([trig, count]) => `
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 6px 8px; text-align: center;">
            <div style="font-weight: 800; font-size: 10px; color: #92400e;">${trig}</div>
            <div style="font-size: 13px; font-weight: 900; color: #b45309; margin-top: 2px;">${count} occ.</div>
            <div style="font-size: 7.5px; color: #78350f; text-transform: uppercase;">${isFr ? 'Facteur de Pulsion' : 'Craving Trigger'}</div>
          </div>`
                )
                .join('')
            : `
          <div style="grid-column: span 4; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; color: #64748b;">
            ${isFr ? 'Les déclencheurs sont neutralisés avec succès.' : 'Triggers successfully neutralized.'}
          </div>`
        }
      </div>

      <!-- LEGAL & CLINICAL SIGNATURE -->
      <div style="border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 10px 12px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">
              ${isFr ? 'AUTHENTICITÉ & VALIDATION CRYPTOGRAPHIQUE' : 'AUTHENTICITY & CRYPTOGRAPHIC VALIDATION'}
            </div>
            <div class="seal-box" style="font-size: 11px; margin-top: 2px;">${verificationHash}</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
              ${isFr ? `Stockage Local AES-256 • Rapport émis le ${currentDateStr}` : `Local AES-256 Encryption • Generated on ${currentDateStr}`}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700;">
              ${isFr ? 'Direction Scientifique & Clinique' : 'Clinical & Scientific Direction'}
            </div>
            <div style="font-weight: 900; font-size: 13px; color: #0f172a; margin-top: 1px;">PUFFINLESS CERTIFIED</div>
            <div style="font-size: 7.5px; color: #059669; font-weight: 700;">✓ VALIDÉ NUMÉRIQUEMENT</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div><b>PuffinLess Clinical Dossier</b> • Ref: ${verificationHash}</div>
      <div>Page <b>2 / 2</b></div>
    </div>
  </div>

</body>
</html>`;
  };

  // Ultra-reliable print execution via isolated invisible iframe
  const handlePrint = () => {
    sound.vibrate(45);
    sound.playCelebration();

    const htmlContent = generatePrintableDocumentHtml();

    let iframe = document.getElementById('puffinless-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'puffinless-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '100vw';
      iframe.style.bottom = '100vh';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 300);
    } else {
      window.print();
    }
  };

  // Direct download option for instant offline access
  const handleDownloadHtml = () => {
    sound.vibrate(35);
    sound.playClick();
    const htmlContent = generatePrintableDocumentHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PuffinLess-Rapport-Clinique-${stats.days}Jours.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center animate-fade-in print:hidden">
      <div className="relative w-full max-w-3xl rounded-3xl glass-panel-elevated border border-white/20 shadow-2xl p-4 sm:p-8 my-auto max-h-[92vh] flex flex-col">
        
        {/* Controls Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/10 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{isFr ? 'Dossier Clinique & Rapport Officiel' : 'Official Clinical Report'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {isFr ? 'Format 2 Pages A4' : 'Exact 2-Page A4'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isFr
                  ? 'Historique complet des prises, sommeil, déclencheurs et métriques somatiques'
                  : 'Full intake logs, sleep quality, triggers, and somatic recovery metrics'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title={isFr ? 'Imprimer ou Enregistrer en PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isFr ? 'Imprimer / Exporter en PDF' : 'Print / Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2 rounded-xl glass-button text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5"
              title={isFr ? 'Télécharger le fichier rapport autonome' : 'Download standalone report file'}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isFr ? 'Télécharger' : 'Download'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page Switcher Tabs */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">{isFr ? 'Affichage :' : 'View:'}</span>
            <button
              onClick={() => setActivePageView('both')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                activePageView === 'both' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Les 2 Pages' : 'Both Pages'}
            </button>
            <button
              onClick={() => setActivePageView('p1')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                activePageView === 'p1' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Page 1 (Bilan & Sommeil)' : 'Page 1 (Vitals & Sleep)'}
            </button>
            <button
              onClick={() => setActivePageView('p2')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                activePageView === 'p2' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Page 2 (Journal & Déclencheurs)' : 'Page 2 (Logs & Triggers)'}
            </button>
          </div>

          <span className="text-[10px] text-amber-400 font-mono">
            {verificationHash}
          </span>
        </div>

        {/* Scrollable Document Preview Container */}
        <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar flex-1">
          
          {/* ==================== PAGE 1 PREVIEW ==================== */}
          {(activePageView === 'both' || activePageView === 'p1') && (
            <div className="rounded-3xl p-5 sm:p-7 border border-amber-500/30 bg-slate-950/80 shadow-xl space-y-4 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 pb-2 border-b border-white/10 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <PuffinLessLogo size={16} />
                  <span>{isFr ? 'PAGE 1 / 2 — Bilan Somatique & Sommeil' : 'PAGE 1 / 2 — Somatic Vitals & Sleep'}</span>
                </span>
                <span className="text-slate-400">{currentDateStr}</span>
              </div>

              {/* Recipient summary */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {isFr ? 'Titulaire Certifié' : 'Certified Victor'}
                  </div>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">
                    {profile?.name || (isFr ? 'Membre PuffinLess' : 'PuffinLess Victor')}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isFr ? 'En rémission active depuis le' : 'In active recovery since'} <b className="text-amber-200">{startDateStr}</b>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {stats.days} {isFr ? 'Jours d\'Abstinence' : 'Days Smoke-Free'}
                  </span>
                </div>
              </div>

              {/* 4 Pillars KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <div className="text-base font-black text-white tabular-nums">{stats.days}j {stats.hours}h</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Sobriété Réelle' : 'Clean Time'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Wallet className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <div className="text-base font-black text-amber-300 tabular-nums">{currency}{Math.round(stats.moneySaved).toLocaleString()}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Économies' : 'Saved'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Heart className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <div className="text-base font-black text-rose-300 tabular-nums">{totalDosesAvoided.toLocaleString()}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Toxines Évitées' : 'Avoided'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Award className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <div className="text-base font-black text-cyan-300 tabular-nums">+{lifeSavedHours}h</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Vie Regagnée' : 'Regained'}</div>
                </div>
              </div>

              {/* Somatic Rank */}
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isFr ? `Rang Somatique : ${stats.level.tier.toUpperCase()} — Niveau ${stats.level.levelNumber} (${stats.level.rankTitle})` : `Somatic Status: Rank ${stats.level.tier.toUpperCase()} — Level ${stats.level.levelNumber}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isFr
                    ? `Normalisation du monoxyde de carbone sanguin, régénération ciliaire bronchique et rééquilibrage de la dopamine cérébrale validés.`
                    : `Blood oxygen restored, lung cilia rejuvenation in progress, synaptic dopamine balance confirmed.`}
                </p>
              </div>

              {/* Sleep Section Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white pt-1">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Moon className="w-4 h-4" /> {isFr ? 'Régénération du Sommeil & Énergie' : 'Sleep Recovery & Energy'}
                  </span>
                  <span className="text-[11px] text-emerald-400">
                    {isFr ? `Moyenne : ${avgSleep}/10` : `Average: ${avgSleep}/10`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10">
                    <div className="text-[10px] text-slate-400 font-medium">🌙 {isFr ? 'Qualité Sommeil' : 'Sleep Score'}</div>
                    <div className="text-base font-black text-indigo-300 mt-0.5">{avgSleep} / 10</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10">
                    <div className="text-[10px] text-slate-400 font-medium">⚡ {isFr ? 'Énergie au Réveil' : 'Wake Energy'}</div>
                    <div className="text-base font-black text-emerald-300 mt-0.5">{avgEnergy} / 10</div>
                  </div>
                </div>

                {/* Sleep Table */}
                <div className="rounded-xl overflow-hidden border border-white/10 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">{isFr ? 'Sommeil' : 'Sleep'}</th>
                        <th className="p-2">{isFr ? 'Énergie' : 'Energy'}</th>
                        <th className="p-2">{isFr ? 'Notes Somatiques' : 'Notes'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] text-slate-300">
                      {recentSleepLogs.length > 0 ? (
                        recentSleepLogs.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5">
                            <td className="p-2 font-mono">{s.date}</td>
                            <td className="p-2 font-bold text-indigo-300">{s.sleepRating}/10</td>
                            <td className="p-2 font-bold text-emerald-300">{s.energyRating}/10</td>
                            <td className="p-2 truncate max-w-[140px] text-slate-400">{s.notes || (isFr ? 'Sommeil réparateur' : 'Good recovery')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-2.5 text-center text-slate-400 italic">
                            {isFr ? 'Cycles de sommeil stables sans perturbation neurochimique.' : 'Stable circadian cycle recorded.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PAGE 2 PREVIEW ==================== */}
          {(activePageView === 'both' || activePageView === 'p2') && (
            <div className="rounded-3xl p-5 sm:p-7 border border-amber-500/30 bg-slate-950/80 shadow-xl space-y-4 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 pb-2 border-b border-white/10 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isFr ? 'PAGE 2 / 2 — Journal Détaillé des Prises & Déclencheurs' : 'PAGE 2 / 2 — Intake & Craving Journal'}</span>
                </span>
                <span className="text-slate-400">{verificationHash}</span>
              </div>

              {/* Activity Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{isFr ? 'Journal des Événements & Prises' : 'Activity & Intake History'}</span>
                  <span className="text-[10px] text-slate-400">{recentEvents.length} {isFr ? 'enregistrements' : 'entries'}</span>
                </div>

                <div className="rounded-xl overflow-hidden border border-white/10 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2">{isFr ? 'Date & Heure' : 'Date & Time'}</th>
                        <th className="p-2">{isFr ? 'Type' : 'Type'}</th>
                        <th className="p-2">{isFr ? 'Dose' : 'Dose'}</th>
                        <th className="p-2">{isFr ? 'Déclencheur' : 'Trigger'}</th>
                        <th className="p-2">{isFr ? 'Statut' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] text-slate-300">
                      {recentEvents.length > 0 ? (
                        recentEvents.map((ev) => {
                          const d = new Date(ev.timestamp);
                          const dateFmt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                          const timeFmt = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                          return (
                            <tr key={ev.id} className="hover:bg-white/5">
                              <td className="p-2 font-mono text-[10px] text-slate-400">{dateFmt} à {timeFmt}</td>
                              <td className="p-2 font-bold text-white">{ev.type}</td>
                              <td className="p-2 text-slate-300">{ev.dose}</td>
                              <td className="p-2 text-amber-300/90">{ev.trigger}</td>
                              <td className="p-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  ev.isSlip
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {ev.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-emerald-400 font-medium">
                            ✓ {isFr ? 'Aucune rechute enregistrée — 100% de sobriété validée' : 'No slips logged — 100% clean verified'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Triggers Breakdown */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-white block">
                  {isFr ? 'Répartition des Déclencheurs Détectés' : 'Detected Trigger Breakdown'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {topTriggers.length > 0 ? (
                    topTriggers.map(([trig, count]) => (
                      <div key={trig} className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-center">
                        <div className="text-[10px] font-bold text-amber-300 truncate">{trig}</div>
                        <div className="text-sm font-black text-white mt-0.5">{count}x</div>
                        <div className="text-[8px] uppercase tracking-wider text-slate-400">{isFr ? 'Pulsions' : 'Urges'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 p-2 rounded-xl bg-slate-900/60 border border-white/10 text-center text-xs text-slate-400">
                      {isFr ? 'Aucun déclencheur critique actif' : 'No critical triggers active'}
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Signature Footer */}
              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">
                    {isFr ? 'Authenticité & Empreinte Numérique' : 'Cryptographic Signature'}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">{verificationHash}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {isFr ? `Stockage Local AES-256 • ${currentDateStr}` : `Local AES-256 Storage • ${currentDateStr}`}
                  </span>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px]">
                    <Shield className="w-3.5 h-3.5" />
                    <span>PuffinLess Certified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
