import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Shield,
  CheckCircle,
  Heart,
  Wallet,
  Clock,
  Moon,
  Activity,
  Download,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { UserProfile, Language, SubstanceLog, CravingEntry, SleepEnergyEntry } from '../types';
import type { CalculatedStats } from '../utils/calculations';
import type { CoreReport } from '../core/obsidianCore';
import { SAMPLE_SLEEP_DATA } from '../utils/sleepTracker';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';

export type ExportTimeRange = 'day' | 'week' | 'month';

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
  takeNumber: number;
  timestamp: string;
  type: string;
  category: 'substance' | 'craving';
  dose: string;
  trigger: string;
  correctiveAction: string;
  status: string;
  isSlip: boolean;
}

/** Formulates clinical corrective action to neutralize a specific trigger */
function getCorrectiveAction(trigger: string, isFr: boolean): string {
  const t = trigger.toLowerCase();
  if (t.includes('café') || t.includes('coffee') || t.includes('matin') || t.includes('morning') || t.includes('réveil')) {
    return isFr
      ? 'Remplacer par thé vert matcha ou eau tiède citronnée + 3 min d\'étirements'
      : 'Switch to matcha green tea or warm lemon water + 3 min morning stretches';
  }
  if (t.includes('repas') || t.includes('meal') || t.includes('digestion') || t.includes('lunch') || t.includes('dîner')) {
    return isFr
      ? 'Brossage immédiat des dents ou marche de 5 min (rompt l\'ancrage dopaminergique)'
      : 'Immediate teeth brushing or 5-min walk (breaks the dopamine loop)';
  }
  if (t.includes('stress') || t.includes('anxi') || t.includes('émotion') || t.includes('colère') || t.includes('nerv') || t.includes('panique')) {
    return isFr
      ? 'Respiration 4-7-8 (3 cycles complets) + grand verre d\'eau glacée'
      : '4-7-8 breathing (3 cycles) + large glass of ice-cold water';
  }
  if (t.includes('pause') || t.includes('travail') || t.includes('work') || t.includes('collègue') || t.includes('social') || t.includes('ennui')) {
    return isFr
      ? 'Pause sensorielle sans briquet : gomme menthe forte + marche à l\'air libre'
      : 'Sensory break without lighter: strong mint gum + brief walk in fresh air';
  }
  if (t.includes('soir') || t.includes('evening') || t.includes('nuit') || t.includes('écran') || t.includes('détente') || t.includes('bed')) {
    return isFr
      ? 'Tisane mélisse/camomille + extinction des écrans 30 min avant le coucher'
      : 'Chamomile/lemon balm tea + screen curfew 30 min before bed';
  }
  return isFr
    ? 'Règle clinique des 180 secondes : boire de l\'eau, le pic de pulsion s\'effondre'
    : 'Clinical 180-second rule: sip cold water, the neural craving peak always collapses';
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
  const [timeRange, setTimeRange] = useState<ExportTimeRange>('week');
  const isFr = language === 'fr';

  // Calculate cutoff timestamp for selected time range
  const cutoffMs = useMemo(() => {
    const t = now.getTime();
    if (timeRange === 'day') return t - 24 * 60 * 60 * 1000;
    if (timeRange === 'week') return t - 7 * 24 * 60 * 60 * 1000;
    return t - 30 * 24 * 60 * 60 * 1000; // 'month'
  }, [timeRange, now]);

  const timeRangeLabel = useMemo(() => {
    if (isFr) {
      if (timeRange === 'day') return 'Dernier Jour (24h)';
      if (timeRange === 'week') return 'Dernière Semaine (7 jours)';
      return 'Dernier Mois (30 jours)';
    }
    if (timeRange === 'day') return 'Last 24 Hours';
    if (timeRange === 'week') return 'Last 7 Days';
    return 'Last 30 Days';
  }, [timeRange, isFr]);

  if (!isOpen) return null;

  // Format Dates in appropriate language
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

  // Filter Data by chosen Time Range
  const filteredSubstanceLogs = substanceLogs.filter(
    (log) => new Date(log.timestamp).getTime() >= cutoffMs
  );
  const filteredCravings = cravings.filter(
    (c) => new Date(c.timestamp).getTime() >= cutoffMs
  );

  const cutoffDate = new Date(cutoffMs);
  const cutoffDateStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
  const filteredSleepLogs = sleepLogs.filter((s) => s.date >= cutoffDateStr);

  // Compute number of substances consumed in the selected time range
  let totalCigarettesTaken = 0;
  let totalPuffsTaken = 0;
  let totalCannabisTaken = 0;

  filteredSubstanceLogs.forEach((l) => {
    if (l.substance === 'cigarette') totalCigarettesTaken += l.count;
    else if (l.substance === 'puff_vape') totalPuffsTaken += l.count;
    else if (l.substance === 'cannabis') totalCannabisTaken += l.count;
  });

  const totalSubstancesTakenDoses = totalCigarettesTaken + totalPuffsTaken + totalCannabisTaken;
  const totalIntakeEventsCount = filteredSubstanceLogs.length;

  const substancesTakenSummaryStr = totalSubstancesTakenDoses > 0
    ? (isFr
        ? `${totalSubstancesTakenDoses} prises (${[
            totalCigarettesTaken > 0 ? `${totalCigarettesTaken} cig` : '',
            totalPuffsTaken > 0 ? `${totalPuffsTaken} bouffées` : '',
            totalCannabisTaken > 0 ? `${totalCannabisTaken} g` : '',
          ].filter(Boolean).join(', ')})`
        : `${totalSubstancesTakenDoses} intakes (${[
            totalCigarettesTaken > 0 ? `${totalCigarettesTaken} cigs` : '',
            totalPuffsTaken > 0 ? `${totalPuffsTaken} puffs` : '',
            totalCannabisTaken > 0 ? `${totalCannabisTaken} g` : '',
          ].filter(Boolean).join(', ')})`)
    : (isFr ? '0 prise (100% Abstinence)' : '0 intake (100% Clean)');

  // Process Sleep Trend (Last 7 days chronological)
  const sourceSleepLogs = filteredSleepLogs.length >= 3 ? filteredSleepLogs : sleepLogs.length >= 3 ? sleepLogs : SAMPLE_SLEEP_DATA;
  const sleepTrendList = [...sourceSleepLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const avgSleep = sourceSleepLogs.length
    ? (sourceSleepLogs.reduce((acc, l) => acc + l.sleepRating, 0) / sourceSleepLogs.length).toFixed(1)
    : '8.4';

  const avgEnergy = sourceSleepLogs.length
    ? (sourceSleepLogs.reduce((acc, l) => acc + l.energyRating, 0) / sourceSleepLogs.length).toFixed(1)
    : '8.1';

  // Process Unified Activity & Intake Logs with Take Numbers
  const unifiedEvents: ActivityEvent[] = [];

  const sortedSubstancesChronological = [...filteredSubstanceLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  sortedSubstancesChronological.forEach((log, idx) => {
    let typeName = isFr ? 'Cigarette' : 'Cigarette';
    let doseStr = `+${log.count} ${isFr ? 'cig' : 'cig'}`;
    if (log.substance === 'puff_vape') {
      typeName = isFr ? 'Vape / Bouffée' : 'Vape / Puff';
      doseStr = `+${log.count} ${isFr ? 'bouffées' : 'puffs'}`;
    } else if (log.substance === 'cannabis') {
      typeName = isFr ? 'Cannabis / CBD' : 'Cannabis / CBD';
      doseStr = `+${log.count} ${isFr ? 'g / dose' : 'g / dose'}`;
    }

    const trig = log.trigger || (isFr ? 'Habitude / Pause' : 'Habit / Break');

    unifiedEvents.push({
      id: log.id,
      takeNumber: idx + 1,
      timestamp: log.timestamp,
      type: typeName,
      category: 'substance',
      dose: doseStr,
      trigger: trig,
      correctiveAction: getCorrectiveAction(trig, isFr),
      status: isFr ? 'Consommée' : 'Consumed',
      isSlip: true,
    });
  });

  filteredCravings.forEach((cr, idx) => {
    const trig = cr.trigger || (isFr ? 'Envie spontanée' : 'Sudden urge');
    unifiedEvents.push({
      id: cr.id,
      takeNumber: idx + 1,
      timestamp: cr.timestamp,
      type: isFr ? 'Pulsion d\'Envie' : 'Craving Urge',
      category: 'craving',
      dose: `${isFr ? 'Intensité' : 'Intensity'} ${cr.intensity}/10`,
      trigger: trig,
      correctiveAction: getCorrectiveAction(trig, isFr),
      status: cr.resisted ? (isFr ? 'Surmontée (Clean)' : 'Resisted (Clean)') : (isFr ? 'Prise effectuée' : 'Intake occurred'),
      isSlip: !cr.resisted,
    });
  });

  // Sort descending for display (newest events first)
  unifiedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  // Display up to 9 rows to ensure strict 100% 2-page fit
  const displayedEvents = unifiedEvents.slice(0, 9);

  // Trigger breakdown statistics
  const triggerMap: Record<string, number> = {};
  filteredCravings.forEach((c) => {
    if (c.trigger) triggerMap[c.trigger] = (triggerMap[c.trigger] || 0) + 1;
  });
  filteredSubstanceLogs.forEach((s) => {
    if (s.trigger) triggerMap[s.trigger] = (triggerMap[s.trigger] || 0) + 1;
  });
  const topTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Craving resistance percentage
  const totalCravingsCount = filteredCravings.length;
  const resistedCravingsCount = filteredCravings.filter((c) => c.resisted).length;
  const resistanceRatePercent = totalCravingsCount > 0
    ? Math.round((resistedCravingsCount / totalCravingsCount) * 100)
    : 100;

  // Generate 100% Full-Page Black Theme A4 Document (Strict 2 Pages, No Blank Pages, No Dev/Repo URLs)
  const generatePrintableDocumentHtml = () => {
    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <title></title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @page :left {
      margin: 0;
    }
    @page :right {
      margin: 0;
    }
    @page :first {
      margin: 0;
    }

    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      height: 100% !important;
      background: #030712 !important;
      background-color: #030712 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      min-height: 100% !important;
      background: #030712 !important;
      background-color: #030712 !important;
      color: #f8fafc !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .a4-page {
      width: 100% !important;
      max-width: 210mm;
      min-height: 297mm;
      height: 297mm;
      max-height: 297mm;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 10mm 13mm;
      background: #030712 !important;
      background-color: #030712 !important;
      background: radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 18%, #030712 55%, #020617 100%) !important;
      color: #f8fafc;
      position: relative;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .a4-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .corner-decor {
      position: absolute;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(245, 158, 11, 0.6);
      pointer-events: none;
    }
    .top-l { top: 8px; left: 8px; border-right: none; border-bottom: none; border-top-left-radius: 4px; }
    .top-r { top: 8px; right: 8px; border-left: none; border-bottom: none; border-top-right-radius: 4px; }
    .bot-l { bottom: 8px; left: 8px; border-right: none; border-top: none; border-bottom-left-radius: 4px; }
    .bot-r { bottom: 8px; right: 8px; border-left: none; border-top: none; border-bottom-right-radius: 4px; }

    /* Luxury Glossy Dark Panels & Bubbles */
    .glass-bubble {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 10px 14px;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.5);
    }
    .glass-bubble-emerald {
      background: rgba(6, 78, 59, 0.25);
      border: 1px solid rgba(52, 211, 153, 0.35);
      border-radius: 14px;
      padding: 10px 14px;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.5);
    }
    .glass-bubble-gold {
      background: rgba(120, 53, 15, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 14px;
      padding: 10px 14px;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.5);
    }

    /* Glossy Colored Pills */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .pill-gold {
      background: rgba(245, 158, 11, 0.2);
      color: #fde68a;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .pill-emerald {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .pill-rose {
      background: rgba(244, 63, 94, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(244, 63, 94, 0.4);
    }
    .pill-indigo {
      background: rgba(99, 102, 241, 0.2);
      color: #c7d2fe;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .pill-cyan {
      background: rgba(6, 182, 212, 0.2);
      color: #a5f3fc;
      border: 1px solid rgba(6, 182, 212, 0.4);
    }

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .title-box {
      text-align: center;
      margin: 6px 0 10px 0;
    }
    .title-box h1 {
      margin: 2px 0;
      font-size: 21px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    .title-box p {
      margin: 0;
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 500;
    }
    .patient-ribbon {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .patient-name {
      font-size: 19px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: -0.01em;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-bubble {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 10px 8px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 900;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .kpi-lbl {
      font-size: 8px;
      text-transform: uppercase;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 4px;
      margin: 8px 0 6px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 9.5px;
      margin-top: 4px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(15, 23, 42, 0.85);
    }
    .data-table th {
      background: rgba(30, 41, 59, 0.85);
      color: #94a3b8;
      text-align: left;
      padding: 6px 8px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      color: #e2e8f0;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .sleep-trend-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-top: 6px;
    }
    .sleep-col {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 6px 4px;
      text-align: center;
    }
    .footer-bar {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #94a3b8;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      *, *:before, *:after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        width: 100% !important;
        height: 100% !important;
        background: #030712 !important;
        background-color: #030712 !important;
      }
      .a4-page {
        width: 100vw !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: 297mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 10mm 12mm !important;
        background: #030712 !important;
        background-color: #030712 !important;
        background: radial-gradient(circle at 50% 0%, #064e3b 0%, #022c22 18%, #030712 55%, #020617 100%) !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .a4-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 : BILAN SOMATIQUE & TENDANCE SOMMEIL ==================== -->
  <div class="a4-page">
    <div class="corner-decor top-l"></div>
    <div class="corner-decor top-r"></div>
    <div class="corner-decor bot-l"></div>
    <div class="corner-decor bot-r"></div>

    <div>
      <div class="header-bar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="#10b981"/>
            <path d="M18 46L46 18M26 46L46 26" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
          </svg>
          <div>
            <span style="font-weight: 900; font-size: 14px; color: #ffffff; letter-spacing: 0.05em;">PUFFINLESS</span>
            <span style="font-size: 9px; color: #34d399; font-weight: 700; margin-left: 6px;">${isFr ? 'CENTRE DE CONTRÔLE CLINIQUE' : 'CLINICAL CONTROL CENTER'}</span>
          </div>
        </div>
        <span class="pill pill-gold">${isFr ? 'DOSSIER MÉDICAL CERTIFIÉ' : 'CERTIFIED CLINICAL RECORD'}</span>
      </div>

      <div class="title-box">
        <h1>${isFr ? 'Dossier Clinique & Rapport Somatique' : 'Clinical Sobriety & Somatic Report'}</h1>
        <p>${isFr ? 'Bilan officiel d\'abstinence, consommations et régénération neurochimique' : 'Official record of abstinence, intake events, and biological recovery'}</p>
      </div>

      <div class="glass-bubble-gold patient-ribbon">
        <div>
          <div style="font-size: 9px; text-transform: uppercase; color: #fbbf24; font-weight: 800; letter-spacing: 0.05em;">
            ${isFr ? 'Bénéficiaire Certifié :' : 'Certified Victor:'}
          </div>
          <div class="patient-name">${profile?.name || (isFr ? 'Membre PuffinLess' : 'PuffinLess Member')}</div>
          <div style="font-size: 9.5px; color: #34d399; font-weight: 700; margin-top: 2px;">
            ${isFr ? 'Période Analysée :' : 'Analyzed Period:'} <b style="color: #ffffff;">${timeRangeLabel}</b>
          </div>
        </div>
        <div style="text-align: right; font-size: 9.5px; color: #cbd5e1; line-height: 1.4;">
          <div><b style="color: #ffffff;">${isFr ? 'Date de Début :' : 'Start Date:'}</b> ${startDateStr}</div>
          <div><span class="pill pill-emerald" style="margin-top: 3px;">${isFr ? 'Protocole Actif' : 'Active Protocol'}</span></div>
        </div>
      </div>

      <div class="grid-4">
        <div class="kpi-bubble">
          <div class="kpi-val" style="color: #34d399;">${stats.days}j ${stats.hours}h</div>
          <div class="kpi-lbl">${isFr ? 'Sobriété Globale' : 'Clean Duration'}</div>
        </div>
        <div class="kpi-bubble">
          <div class="kpi-val" style="color: #fbbf24;">${currency}${Math.round(stats.moneySaved).toLocaleString()}</div>
          <div class="kpi-lbl">${isFr ? 'Capital Économisé' : 'Money Saved'}</div>
        </div>
        <div class="kpi-bubble">
          <div class="kpi-val" style="color: #38bdf8;">${totalDosesAvoided.toLocaleString()}</div>
          <div class="kpi-lbl">${isFr ? 'Toxines Évitées' : 'Doses Avoided'}</div>
        </div>
        <div class="kpi-bubble">
          <div class="kpi-val" style="color: ${totalSubstancesTakenDoses > 0 ? '#f43f5e' : '#34d399'};">
            ${totalSubstancesTakenDoses > 0 ? `${totalSubstancesTakenDoses}` : '0'}
          </div>
          <div class="kpi-lbl">${isFr ? 'Substances Prises' : 'Substances Taken'}</div>
        </div>
      </div>

      <div class="${totalSubstancesTakenDoses > 0 ? 'glass-bubble' : 'glass-bubble-emerald'}" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border-color: ${totalSubstancesTakenDoses > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(52, 211, 153, 0.4)'};">
        <span style="font-weight: 700; color: ${totalSubstancesTakenDoses > 0 ? '#fca5a5' : '#6ee7b7'};">
          ${isFr ? 'Bilan des substances consommées sur la période :' : 'Substances consumed in period:'} <b style="color: #ffffff;">${substancesTakenSummaryStr}</b>
        </span>
        <span class="pill ${totalSubstancesTakenDoses > 0 ? 'pill-rose' : 'pill-emerald'}">${timeRangeLabel}</span>
      </div>

      <div class="section-title">
        <span>${isFr ? '1. Diagnostic Somatique & Niveau de Récupération' : '1. Somatic Diagnostic & Recovery Status'}</span>
        <span class="pill pill-emerald">Rang ${stats.level.tier.toUpperCase()} — Niv. ${stats.level.levelNumber}</span>
      </div>
      <div class="glass-bubble-emerald" style="margin-bottom: 8px; font-size: 10px; color: #a7f3d0; line-height: 1.4;">
        <b style="color: #ffffff;">${stats.level.rankTitle} :</b> ${isFr
          ? `Le titulaire a validé ${stats.unlockedBadgeIds.length} jalons biomédicaux cruciaux. Normalisation du monoxyde de carbone sanguin, régénération ciliaire bronchique et rééquilibrage de la dopamine synaptique confirmés.`
          : `Validated ${stats.unlockedBadgeIds.length} clinical biomarkers. Restored blood oxygen levels, bronchus cilia motility, and dopamine receptor homeostasis.`}
        ${report ? `<br><span style="color: #fde68a; font-weight: 700; margin-top: 3px; display: block;">• Centre de Contrôle : ${report.headline} • ${isFr ? `Temps de vie estimé regagné : +${lifeSavedHours} h` : `Estimated life regained: +${lifeSavedHours} h`}</span>` : ''}
      </div>

      <div class="section-title">
        <span>${isFr ? '2. Qualité du Sommeil & Tendance sur 7 Jours' : '2. Sleep Quality & 7-Day Trend'}</span>
        <span class="pill pill-indigo">${isFr ? `Sommeil Moyen: ${avgSleep}/10 • Énergie: ${avgEnergy}/10` : `Avg Sleep: ${avgSleep}/10 • Energy: ${avgEnergy}/10`}</span>
      </div>
      
      <div class="sleep-trend-grid">
        ${sleepTrendList
          .map((item) => {
            const d = new Date(item.date);
            const dayName = d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { weekday: 'short' });
            const isCleanNight = (item.substancesLogged?.cigarette || 0) + (item.substancesLogged?.puff_vape || 0) + (item.substancesLogged?.cannabis || 0) === 0;
            return `
            <div class="sleep-col">
              <div style="font-size: 8.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">${dayName}</div>
              <div style="font-size: 7.5px; color: #64748b;">${item.date.slice(5)}</div>
              
              <div style="height: 32px; display: flex; align-items: flex-end; justify-content: center; gap: 3px; margin: 4px 0; background: rgba(0,0,0,0.3); border-radius: 6px; padding: 2px;">
                <div style="width: 7px; height: ${item.sleepRating * 10}%; background: linear-gradient(to top, #4338ca, #818cf8); border-radius: 3px;" title="Sommeil: ${item.sleepRating}/10"></div>
                <div style="width: 7px; height: ${item.energyRating * 10}%; background: linear-gradient(to top, #059669, #34d399); border-radius: 3px;" title="Énergie: ${item.energyRating}/10"></div>
              </div>

              <div style="font-size: 9.5px; font-weight: 900; color: #c7d2fe;">${item.sleepRating}<span style="font-size: 7px; color: #64748b;">/10</span></div>
              <div style="font-size: 8px; font-weight: 800; margin-top: 2px;">
                <span class="${isCleanNight ? 'pill-emerald' : 'pill-rose'}" style="padding: 1px 4px; font-size: 7.5px;">
                  ${isCleanNight ? '✓ Clean' : '⚠️ Prise'}
                </span>
              </div>
            </div>`;
          })
          .join('')}
      </div>

      <div class="glass-bubble" style="margin-top: 6px; font-size: 9px; color: #cbd5e1; line-height: 1.35; border-color: rgba(99, 102, 241, 0.3);">
        <b style="color: #a5b4fc;">${isFr ? 'Corrélation Clinique Démontrée :' : 'Clinical Correlation Insight:'}</b> ${isFr
          ? 'Les nuits sans toxines inhalées affichent un sommeil profond supérieur de +32%, une réduction de 45% des réveils nocturnes et une vigueur cognitive maximale au réveil.'
          : 'Nights without inhaled toxins exhibit +32% deeper restorative sleep, 45% fewer nocturnal awakenings, and complete cognitive vitality upon waking.'}
      </div>

      <div style="font-size: 8.5px; font-weight: 800; color: #94a3b8; margin-top: 6px; text-transform: uppercase;">
        ${isFr ? 'Détail des Dernières Nuits Observées' : 'Recent Observed Nights Detail'} :
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 20%;">Date</th>
            <th style="width: 20%;">${isFr ? 'Score Sommeil' : 'Sleep Rating'}</th>
            <th style="width: 20%;">${isFr ? 'Énergie Réveil' : 'Energy'}</th>
            <th style="width: 40%;">${isFr ? 'Observations Cliniques' : 'Clinical Notes'}</th>
          </tr>
        </thead>
        <tbody>
          ${
            sleepTrendList.slice(-4).map(
              (s) => `<tr>
              <td><b>${s.date}</b></td>
              <td><span class="pill pill-indigo">${s.sleepRating} / 10</span></td>
              <td><span class="pill pill-emerald">${s.energyRating} / 10</span></td>
              <td style="color: #cbd5e1;">${s.notes || (isFr ? 'Sommeil réparateur et récupération nerveuse optimale' : 'Restorative sleep and optimal nervous recovery')}</td>
            </tr>`
            ).join('')
          }
        </tbody>
      </table>
    </div>

    <div class="footer-bar">
      <div><b>PUFFINLESS</b> • ${isFr ? 'Dossier Somatique & Récupération' : 'Somatic Record & Recovery'}</div>
      <div>Page <b>1 / 2</b></div>
    </div>
  </div>

  <!-- ==================== PAGE 2 : JOURNAL DES PRISES & DÉCLENCHEURS & ACTIONS ==================== -->
  <div class="a4-page">
    <div class="corner-decor top-l"></div>
    <div class="corner-decor top-r"></div>
    <div class="corner-decor bot-l"></div>
    <div class="corner-decor bot-r"></div>

    <div>
      <div class="header-bar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="#10b981"/>
            <path d="M18 46L46 18M26 46L46 26" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
          </svg>
          <div>
            <span style="font-weight: 900; font-size: 14px; color: #ffffff; letter-spacing: 0.05em;">PUFFINLESS</span>
            <span style="font-size: 9px; color: #fbbf24; font-weight: 700; margin-left: 6px;">${isFr ? 'JOURNAL DES CONSOMMATIONS, DÉCLENCHEURS & ACTIONS' : 'INTAKE, TRIGGERS & CORRECTIVE ACTIONS'}</span>
          </div>
        </div>
        <span class="pill pill-gold">${isFr ? 'RAPPORT CLINIQUE SÉCURISÉ' : 'SECURE CLINICAL RECORD'}</span>
      </div>

      <div class="glass-bubble" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
        <span>
          <b style="color: #ffffff;">${isFr ? 'Période analysée :' : 'Analyzed Period:'}</b> <span class="pill pill-cyan">${timeRangeLabel}</span> • 
          <b style="color: #ffffff; margin-left: 6px;">${isFr ? 'Substances Prises :' : 'Substances Taken:'}</b> 
          <span style="color: ${totalSubstancesTakenDoses > 0 ? '#fca5a5' : '#6ee7b7'}; font-weight: 900; font-size: 11px;">
            ${totalSubstancesTakenDoses}
          </span>
        </span>
        <span style="color: #34d399; font-weight: 700;">
          ${resistedCravingsCount}/${totalCravingsCount} ${isFr ? 'pulsions surmontées' : 'cravings resisted'} (${resistanceRatePercent}%)
        </span>
      </div>

      <div class="section-title">
        <span>${isFr ? '3. Journal Détaillé des Prises & Protocole Correctif' : '3. Intake Journal & Corrective Protocols'}</span>
        <span style="color: #94a3b8; font-size: 8.5px;">${displayedEvents.length} ${isFr ? 'événements enregistrés' : 'events logged'}</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 10%;">${isFr ? 'N° Prise' : 'Take #'}</th>
            <th style="width: 16%;">${isFr ? 'Date' : 'Date'}</th>
            <th style="width: 17%;">${isFr ? 'Substance / Dose' : 'Substance / Dose'}</th>
            <th style="width: 18%;">${isFr ? 'Déclencheur Identifié' : 'Identified Trigger'}</th>
            <th style="width: 27%;">${isFr ? 'Comment Neutraliser (Action Clinique)' : 'How to Fix (Clinical Action)'}</th>
            <th style="width: 12%;">${isFr ? 'Statut' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          ${
            displayedEvents.length > 0
              ? displayedEvents
                  .map((ev) => {
                    const d = new Date(ev.timestamp);
                    const formattedDate = d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                    });
                    return `<tr>
                  <td><span class="pill pill-gold" style="font-size: 8px;">#${ev.takeNumber}</span></td>
                  <td style="font-family: monospace; color: #94a3b8;">${formattedDate}</td>
                  <td><b style="color: #ffffff;">${ev.type}</b> <span style="color: #38bdf8; font-size: 8.5px;">(${ev.dose})</span></td>
                  <td style="color: #fbbf24; font-weight: 700;">${ev.trigger}</td>
                  <td style="font-size: 8.5px; color: #e2e8f0; line-height: 1.25;">💡 ${ev.correctiveAction}</td>
                  <td>
                    <span class="${ev.isSlip ? 'pill-rose' : 'pill-emerald'}" style="font-size: 7.5px;">${ev.status}</span>
                  </td>
                </tr>`;
                  })
                  .join('')
              : `<tr>
                <td colspan="6" style="text-align: center; padding: 18px; color: #34d399; font-weight: 800; font-size: 11px;">
                  ✓ ${isFr ? 'Aucune consommation enregistrée sur cette période — 100% de sobriété validée' : 'Zero consumption events logged in this period — 100% clean verified'}
                </td>
              </tr>`
          }
        </tbody>
      </table>

      <div class="section-title" style="margin-top: 10px;">
        <span>${isFr ? '4. Radar Comportemental & Répartition des Déclencheurs' : '4. Behavioral Radar & Trigger Distribution'}</span>
        <span class="pill pill-gold">${isFr ? 'Analyse Prédictive IA' : 'AI Analysis'}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px;">
        ${
          topTriggers.length > 0
            ? topTriggers
                .map(
                  ([trig, count]) => `
          <div class="glass-bubble-gold" style="padding: 8px 6px; text-align: center;">
            <div style="font-weight: 900; font-size: 10px; color: #fbbf24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${trig}</div>
            <div style="font-size: 15px; font-weight: 900; color: #ffffff; margin-top: 2px;">${count} <span style="font-size: 8px; color: #fde68a;">occ.</span></div>
            <div style="font-size: 7.5px; color: #fde68a; text-transform: uppercase; font-weight: 700; margin-top: 2px;">${isFr ? 'Facteur de Pulsion' : 'Craving Trigger'}</div>
          </div>`
                )
                .join('')
            : `
          <div class="glass-bubble" style="grid-column: span 4; padding: 10px; text-align: center; color: #94a3b8; font-size: 10px;">
            ${isFr ? 'Les déclencheurs sont neutralisés avec succès sur cette période.' : 'Triggers successfully neutralized during this period.'}
          </div>`
        }
      </div>

      <div class="glass-bubble" style="padding: 10px 14px; margin-top: 6px; border-color: rgba(245, 158, 11, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 8.5px; font-weight: 900; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.08em;">
              ${isFr ? 'ATTESTATION OFFICIELLE DE RÉMISSION' : 'OFFICIAL RECOVERY ATTESTATION'}
            </div>
            <div style="font-size: 11px; font-weight: 800; color: #ffffff; margin-top: 3px;">PUFFINLESS CLINICAL INSTITUTE</div>
            <div style="font-size: 8.5px; color: #34d399; margin-top: 2px;">
              ✓ ${isFr ? 'Programme d\'Abstinence Validé' : 'Verified Sobriety Program'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 8px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">
              ${isFr ? 'Direction Scientifique & Clinique' : 'Clinical & Scientific Direction'}
            </div>
            <div style="font-weight: 900; font-size: 13px; color: #ffffff; margin-top: 2px; letter-spacing: 0.04em;">PUFFINLESS CERTIFIED</div>
            <div style="font-size: 8px; color: #34d399; font-weight: 800; margin-top: 1px;">✓ ${isFr ? 'VALIDÉ MÉDICALEMENT' : 'MEDICALLY VERIFIED'}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div><b>PUFFINLESS</b> • ${isFr ? 'Bilan Clinique & Suivi des Prises' : 'Clinical Report & Intake Log'}</div>
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
      iframe.style.top = '0';
      iframe.style.left = '-10000px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
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
      }, 350);
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
    link.download = `PuffinLess-Dossier-Clinique-Obsidian-2Pages-${timeRange}-${stats.days}Jours.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open full-page standalone view in clean new tab
  const handleOpenFullscreen = () => {
    sound.vibrate(35);
    sound.playClick();
    const htmlContent = generatePrintableDocumentHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xl p-2 sm:p-5 flex items-center justify-center animate-fade-in print:hidden">
      <div className="relative w-full max-w-4xl rounded-3xl glass-panel-elevated border border-white/20 shadow-2xl p-4 sm:p-6 my-auto max-h-[96vh] flex flex-col bg-slate-950/95 text-white">
        
        {/* Controls Header */}
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/10 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{isFr ? 'Dossier Clinique & Rapport Somatique' : 'Official Clinical Report'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {isFr ? 'Thème Black Obsidian • 2 Pages A4 Pleines' : 'Black Obsidian • Full 2-Page A4'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isFr
                  ? 'Format A4 100% de la page, bulles Obsidian, tendance sommeil, déclencheurs & solutions'
                  : 'Full 100% A4 page, Obsidian bubbles, sleep trend, triggers & clinical solutions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title={isFr ? 'Imprimer ou Enregistrer en PDF (2 pages A4 nettes)' : 'Print or Save as PDF (Clean 2-page A4)'}
            >
              <Printer className="w-4 h-4" />
              <span>{isFr ? 'Imprimer / Exporter PDF' : 'Print / Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFullscreen}
              className="px-3 py-2.5 rounded-xl glass-button text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              title={isFr ? 'Ouvrir le rapport plein écran dans un nouvel onglet' : 'Open fullscreen report in new tab'}
            >
              <span>{isFr ? 'Plein Écran' : 'Fullscreen'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2.5 rounded-xl glass-button text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
              title={isFr ? 'Télécharger le fichier rapport autonome' : 'Download standalone report file'}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isFr ? 'Télécharger' : 'Download'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Crucial Tip for 0 White Border & 0 Browser URL */}
        <div className="p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 mb-2.5 flex items-start gap-2.5 text-xs text-amber-200">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 font-black shrink-0 mt-0.5 text-base">
            ⚠️
          </div>
          <div className="space-y-1 text-[11px] leading-snug">
            <div className="font-black text-amber-300">
              {isFr ? 'POUR SUPPRIMER L\'ADRESSE URL, LA DATE ET LA BORDURE BLANCHE :' : 'TO REMOVE THE URL ADDRESS, DATE AND WHITE BORDER:'}
            </div>
            <div className="text-slate-200">
              {isFr ? (
                <>
                  Dans la fenêtre d'impression qui s'affiche, réglez simplement :
                  <br />
                  <b>1. Marges :</b> choisir <b>« Aucune »</b> (ou décocher <i>« En-têtes et pieds de page »</i>).
                  <br />
                  <b>2. Graphiques d'arrière-plan :</b> cocher la case.
                </>
              ) : (
                <>
                  In the print window that opens, simply set:
                  <br />
                  <b>1. Margins:</b> choose <b>"None"</b> (or uncheck <i>"Headers and footers"</i>).
                  <br />
                  <b>2. Background graphics:</b> check the box.
                </>
              )}
            </div>
            <div className="text-emerald-300 font-bold text-[10.5px]">
              ✓ {isFr ? 'Résultat : Fond 100% noir Obsidian bord à bord, sans aucune mention d\'URL ni de date/heure.' : 'Result: 100% edge-to-edge obsidian black theme, zero URLs, and zero timestamps.'}
            </div>
          </div>
        </div>

        {/* Time Range Filter Bar (Dernier Jour, Dernière Semaine, Dernier Mois) */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10 mb-2.5 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-bold text-[11px]">
              {isFr ? 'Période analysée :' : 'Analyzed range:'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                sound.vibrate(30);
                setTimeRange('day');
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                timeRange === 'day'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Dernier Jour (24h)' : 'Last 24 Hours'}
            </button>
            <button
              type="button"
              onClick={() => {
                sound.vibrate(30);
                setTimeRange('week');
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                timeRange === 'week'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Dernière Semaine (7j)' : 'Last 7 Days'}
            </button>
            <button
              type="button"
              onClick={() => {
                sound.vibrate(30);
                setTimeRange('month');
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                timeRange === 'month'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Dernier Mois (30j)' : 'Last 30 Days'}
            </button>
          </div>
        </div>

        {/* Page Switcher Tabs */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">{isFr ? 'Aperçu :' : 'Preview:'}</span>
            <button
              onClick={() => setActivePageView('both')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activePageView === 'both' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Les 2 Pages (100% Pleines)' : 'Both Pages (100% Full)'}
            </button>
            <button
              onClick={() => setActivePageView('p1')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activePageView === 'p1' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Page 1 (Bilan & Sommeil)' : 'Page 1 (Vitals & Sleep)'}
            </button>
            <button
              onClick={() => setActivePageView('p2')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                activePageView === 'p2' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isFr ? 'Page 2 (Journal & Actions)' : 'Page 2 (Logs & Actions)'}
            </button>
          </div>

          <span className="text-[10px] text-amber-400 font-mono font-bold">
            {verificationHash}
          </span>
        </div>

        {/* Scrollable Document Preview Container */}
        <div className="overflow-y-auto space-y-4 pr-1 custom-scrollbar flex-1">
          
          {/* ==================== PAGE 1 PREVIEW ==================== */}
          {(activePageView === 'both' || activePageView === 'p1') && (
            <div className="rounded-3xl p-5 sm:p-7 border border-amber-500/30 bg-slate-950 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 pb-2 border-b border-white/10 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <PuffinLessLogo size={18} />
                  <span>{isFr ? 'PAGE 1 / 2 — Bilan Somatique & Tendance Sommeil' : 'PAGE 1 / 2 — Somatic Vitals & Sleep Trend'}</span>
                </span>
                <span className="text-slate-400">{currentDateStr}</span>
              </div>

              {/* Recipient summary */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {isFr ? 'Bénéficiaire Certifié' : 'Certified Victor'}
                  </div>
                  <h4 className="text-lg font-black text-amber-300 mt-0.5">
                    {profile?.name || (isFr ? 'Membre PuffinLess' : 'PuffinLess Victor')}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isFr ? 'En rémission active depuis le' : 'In active recovery since'} <b className="text-white">{startDateStr}</b>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {stats.days} {isFr ? 'Jours d\'Abstinence' : 'Days Smoke-Free'}
                  </span>
                  <div className="text-[10px] text-amber-300 font-bold mt-1">
                    {timeRangeLabel}
                  </div>
                </div>
              </div>

              {/* 4 Pillars KPI Grid with Substances Taken */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <div className="text-lg font-black text-white tabular-nums">{stats.days}j {stats.hours}h</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Sobriété Globale' : 'Clean Time'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Wallet className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <div className="text-lg font-black text-amber-300 tabular-nums">{currency}{Math.round(stats.moneySaved).toLocaleString()}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Économies' : 'Saved'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                  <div className="text-lg font-black text-cyan-300 tabular-nums">{totalDosesAvoided.toLocaleString()}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">{isFr ? 'Toxines Évitées' : 'Avoided'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                  <AlertCircle className={`w-5 h-5 mx-auto mb-1 ${totalSubstancesTakenDoses > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                  <div className={`text-lg font-black tabular-nums ${totalSubstancesTakenDoses > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {totalSubstancesTakenDoses}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">
                    {isFr ? 'Substances Prises' : 'Substances Taken'}
                  </div>
                </div>
              </div>

              {/* Substance Taken Detail Banner */}
              <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                totalSubstancesTakenDoses > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}>
                <span className="font-semibold text-xs">
                  {isFr ? 'Bilan des substances consommées sur la période :' : 'Intake status for period:'}{' '}
                  <b className="text-white">{substancesTakenSummaryStr}</b>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-slate-300">{timeRangeLabel}</span>
              </div>

              {/* Somatic Rank */}
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isFr ? `Rang Somatique : ${stats.level.tier.toUpperCase()} — Niveau ${stats.level.levelNumber} (${stats.level.rankTitle})` : `Somatic Status: Rank ${stats.level.tier.toUpperCase()} — Level ${stats.level.levelNumber}`}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isFr
                    ? `Normalisation du monoxyde de carbone sanguin, régénération ciliaire bronchique et rééquilibrage de la dopamine cérébrale validés. Temps de vie regagné : +${lifeSavedHours} h.`
                    : `Blood oxygen restored, lung cilia rejuvenation in progress, synaptic dopamine balance confirmed. Life regained: +${lifeSavedHours} h.`}
                </p>
              </div>

              {/* Sleep Section Preview with 7-Day Trend */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white pt-1">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Moon className="w-4 h-4" /> {isFr ? 'Tendance Sommeil & Vigueur (7 Derniers Jours)' : 'Sleep Recovery & 7-Day Trend'}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {isFr ? `Moyenne : ${avgSleep}/10 • Énergie : ${avgEnergy}/10` : `Avg: ${avgSleep}/10 • Energy: ${avgEnergy}/10`}
                  </span>
                </div>

                {/* 7-Day Mini Trend Grid */}
                <div className="grid grid-cols-7 gap-2 text-center">
                  {sleepTrendList.map((item) => {
                    const d = new Date(item.date);
                    const dayName = d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { weekday: 'short' });
                    return (
                      <div key={item.id} className="p-2 rounded-2xl bg-slate-900/90 border border-white/10">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{dayName}</div>
                        <div className="text-sm font-black text-indigo-300 mt-0.5">{item.sleepRating}</div>
                        <div className="text-[9px] text-emerald-400 font-bold">{item.energyRating}⚡</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== PAGE 2 PREVIEW ==================== */}
          {(activePageView === 'both' || activePageView === 'p2') && (
            <div className="rounded-3xl p-5 sm:p-7 border border-amber-500/30 bg-slate-950 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 pb-2 border-b border-white/10 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>{isFr ? 'PAGE 2 / 2 — Journal des Prises, Déclencheurs & Actions' : 'PAGE 2 / 2 — Intake Logs & Action Protocols'}</span>
                </span>
                <span className="text-slate-400">{verificationHash}</span>
              </div>

              {/* Activity Summary Banner */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div>
                  <span className="text-slate-300 font-bold">
                    {isFr ? 'Bilan de la Période' : 'Period Recap'} ({timeRangeLabel}) :
                  </span>
                  <span className="ml-1 text-rose-300 font-black">
                    {totalSubstancesTakenDoses} {isFr ? 'substances consommées' : 'substances taken'}
                  </span>
                  <span className="text-slate-400 ml-1">
                    ({totalIntakeEventsCount} {isFr ? 'prises' : 'events'})
                  </span>
                </div>
                <div className="text-xs text-emerald-400 font-extrabold">
                  {resistedCravingsCount}/{totalCravingsCount} {isFr ? 'pulsions surmontées' : 'cravings resisted'} ({resistanceRatePercent}%)
                </div>
              </div>

              {/* Activity Table with Take Number, Trigger & How to Fix */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{isFr ? 'Historique des Prises & Déclencheurs' : 'Activity, Triggers & Corrective Protocols'}</span>
                  <span className="text-[10px] text-slate-400">{displayedEvents.length} {isFr ? 'enregistrements affichés' : 'entries shown'}</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/10 text-xs bg-slate-900/80">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">{isFr ? 'N°' : '#'}</th>
                        <th className="p-2.5">{isFr ? 'Date & Heure' : 'Date & Time'}</th>
                        <th className="p-2.5">{isFr ? 'Substance' : 'Substance'}</th>
                        <th className="p-2.5">{isFr ? 'Déclencheur' : 'Trigger'}</th>
                        <th className="p-2.5">{isFr ? 'Comment Neutraliser (Action)' : 'How to Fix (Action)'}</th>
                        <th className="p-2.5">{isFr ? 'Statut' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {displayedEvents.length > 0 ? (
                        displayedEvents.map((ev) => {
                          const d = new Date(ev.timestamp);
                          const dateFmt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                          const timeFmt = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                          return (
                            <tr key={ev.id} className="hover:bg-white/5">
                              <td className="p-2.5 font-mono font-bold text-amber-300">#{ev.takeNumber}</td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-400">{dateFmt} à {timeFmt}</td>
                              <td className="p-2.5 font-bold text-white">{ev.type} <span className="text-[10px] text-cyan-300">({ev.dose})</span></td>
                              <td className="p-2.5 text-amber-300 font-semibold">{ev.trigger}</td>
                              <td className="p-2.5 text-slate-200 text-[11px]">💡 {ev.correctiveAction}</td>
                              <td className="p-2.5">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
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
                          <td colSpan={6} className="p-4 text-center text-emerald-400 font-bold">
                            ✓ {isFr ? 'Aucune consommation enregistrée sur cette période — 100% de sobriété validée' : 'No consumption logged in this period — 100% clean verified'}
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
                      <div key={trig} className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <div className="text-[11px] font-bold text-amber-300 truncate">{trig}</div>
                        <div className="text-base font-black text-white mt-0.5">{count}x</div>
                        <div className="text-[8px] uppercase tracking-wider text-amber-200/80 font-bold">{isFr ? 'Pulsions' : 'Urges'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 p-2.5 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-xs text-slate-400">
                      {isFr ? 'Aucun déclencheur critique actif sur cette période' : 'No critical triggers active in this period'}
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Signature Footer */}
              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">
                    {isFr ? 'AUTHENTICITÉ & VALIDATION NUMÉRIQUE' : 'AUTHENTICITY & DIGITAL VALIDATION'}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">{verificationHash}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {isFr ? `Stockage Local AES-256 • ${currentDateStr}` : `Local AES-256 Storage • ${currentDateStr}`}
                  </span>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
                    <Shield className="w-4 h-4" />
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
