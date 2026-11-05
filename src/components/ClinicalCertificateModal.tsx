import React, { useState } from 'react';
import { X, Printer, Shield, Award, Sparkles, CheckCircle, Heart, Wallet, Clock } from 'lucide-react';
import type { UserProfile, Language } from '../types';
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
  currency: string;
  language?: Language;
}

export const ClinicalCertificateModal: React.FC<ClinicalCertificateModalProps> = ({
  isOpen,
  onClose,
  stats,
  profile,
  report,
  currency,
  language = 'en',
}) => {
  const [now] = useState(() => new Date());
  const isFr = language === 'fr';

  if (!isOpen) return null;

  const handlePrint = () => {
    sound.vibrate(45);
    sound.playCelebration();
    window.print();
  };

  const currentDate = now.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startDate = profile?.quitDate
    ? new Date(profile.quitDate).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : currentDate;
  const year = now.getFullYear();

  const totalDosesAvoided = stats.cigarettesAvoided + stats.puffsAvoided + stats.gramsAvoided;
  const lifeSavedHours = Math.round((stats.days * 24 * 60 * 0.15) / 60);

  const rawName = profile?.name?.trim() || (isFr ? 'MEMBRE CERTIFIÉ' : 'CERTIFIED MEMBER');
  const hash = Math.abs(
    rawName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1337)
  ).toString(16).toUpperCase();
  const verificationHash = `PFL-${stats.days}D-${hash}-${year}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center animate-fade-in print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel-elevated border border-white/20 shadow-2xl p-4 sm:p-8 my-auto print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none">
        
        {/* Screen Controls Header (Hidden during Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isFr ? 'Certificat Officiel de Victoire' : 'Official Victory Certificate'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isFr ? 'Format A4 haute résolution prêt à exporter en PDF' : 'High-resolution A4 format ready for PDF export'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isFr ? 'Imprimer / Exporter en PDF' : 'Print / Export PDF'}</span>
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

        {/* PRINTABLE CERTIFICATE DOCUMENT */}
        <div
          id="puffinless-official-certificate"
          className="puffinless-certificate relative rounded-3xl p-6 sm:p-10 border-2 border-amber-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl overflow-hidden print:bg-white print:text-slate-950 print:border-4 print:border-amber-600 print:rounded-2xl"
        >
          {/* Subtle ornate decorative corner accents */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg pointer-events-none" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg pointer-events-none" />

          {/* Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none print:opacity-[0.04]">
            <PuffinLessLogo size={360} />
          </div>

          <div className="relative space-y-6 text-center">
            {/* Header: Crest & Title */}
            <div className="flex flex-col items-center space-y-2">
              <PuffinLessLogo size={60} className="shadow-xl shadow-amber-500/20" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] tracking-[0.2em] uppercase">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{isFr ? 'Protocole Clinique PuffinLess v2.0' : 'PuffinLess Clinical Protocol v2.0'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white print:text-slate-900 mt-1">
                {isFr ? 'Certificat de Libération Biologique' : 'Clinical Liberation Certificate'}
              </h1>
              <p className="text-xs text-amber-200/80 font-medium tracking-wide">
                {isFr ? 'Attestation Officielle d\'Arrêt & de Victoire Somatique' : 'Official Record of Substance Sobriety & Vitality Restoration'}
              </p>
            </div>

            {/* Recipient Ribbon */}
            <div className="py-3 border-y border-amber-500/20 my-4 bg-amber-500/5 print:bg-slate-50">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 print:text-slate-600 mb-1">
                {isFr ? 'Ce document certifie solennellement les victoires de' : 'This document officially certifies the triumphs of'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-300 print:text-amber-700 tracking-tight">
                {profile?.name || (isFr ? 'Champion PuffinLess' : 'PuffinLess Victor')}
              </h2>
              <p className="text-xs text-slate-300 print:text-slate-700 mt-1">
                {isFr ? 'Engagé dans une vie sans fumée ni dépendance depuis le' : 'Committed to a smoke-free life since'} <b className="text-white print:text-slate-900">{startDate}</b>
              </p>
            </div>

            {/* 4 Clinical Pillars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 print:bg-slate-50 print:border-slate-300">
                <Clock className="w-4 h-4 mx-auto mb-1 text-emerald-400 print:text-emerald-700" />
                <div className="text-lg font-black text-white print:text-slate-900 tabular-nums">
                  {stats.days}j {stats.hours}h
                </div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 print:text-slate-600">
                  {isFr ? 'Sobriété Réelle' : 'Smoke-Free Time'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 print:bg-slate-50 print:border-slate-300">
                <Wallet className="w-4 h-4 mx-auto mb-1 text-amber-400 print:text-amber-700" />
                <div className="text-lg font-black text-amber-300 print:text-amber-700 tabular-nums">
                  {currency}{Math.round(stats.moneySaved).toLocaleString()}
                </div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 print:text-slate-600">
                  {isFr ? 'Capital Sauvegardé' : 'Money Saved'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 print:bg-slate-50 print:border-slate-300">
                <Heart className="w-4 h-4 mx-auto mb-1 text-rose-400 print:text-rose-700" />
                <div className="text-lg font-black text-rose-300 print:text-rose-700 tabular-nums">
                  {totalDosesAvoided.toLocaleString()}
                </div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 print:text-slate-600">
                  {isFr ? 'Toxines Évitées' : 'Doses Avoided'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 print:bg-slate-50 print:border-slate-300">
                <Award className="w-4 h-4 mx-auto mb-1 text-cyan-400 print:text-cyan-700" />
                <div className="text-lg font-black text-cyan-300 print:text-cyan-700 tabular-nums">
                  +{lifeSavedHours} h
                </div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 print:text-slate-600">
                  {isFr ? 'Temps de Vie Regagné' : 'Life Regained'}
                </div>
              </div>
            </div>

            {/* Rank & Clinical Status */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-left flex items-start gap-3 print:bg-emerald-50 print:border-emerald-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 print:text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 print:text-emerald-800 block text-xs">
                  {isFr
                    ? `Statut Somatique : Rang ${stats.level.tier.toUpperCase()} — Niveau ${stats.level.levelNumber} (${stats.level.rankTitle})`
                    : `Somatic Status: Rank ${stats.level.tier.toUpperCase()} — Level ${stats.level.levelNumber} (${stats.level.rankTitle})`}
                </span>
                <p className="text-[11px] text-slate-300 print:text-slate-700 mt-0.5 leading-relaxed">
                  {isFr
                    ? `Le titulaire a validé ${stats.unlockedBadgeIds.length} jalons biomédicaux cruciaux (réduction du monoxyde de carbone sanguin, régénération des cils bronchiques et rééquilibrage de la dopamine cérébrale).`
                    : `The certificate holder has validated ${stats.unlockedBadgeIds.length} biological milestones, including blood oxygen normalization, lung cilia rejuvenation, and dopamine neuroplastic adaptation.`}
                </p>
              </div>
            </div>

            {/* Document Signature & Cryptographic Seal */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-left print:border-slate-300">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 print:text-slate-600 block">
                  {isFr ? 'Authenticité & Empreinte Sécurisée' : 'Cryptographic Verification Seal'}
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-300 print:text-amber-800 block">
                  {verificationHash}
                </span>
                <span className="text-[9px] text-slate-400 print:text-slate-600 block">
                  {isFr ? `Émis le ${currentDate} • Stockage Local AES-256` : `Issued on ${currentDate} • Local AES-256 Storage`}
                </span>
                {report && (
                  <span className="text-[9px] text-emerald-400 print:text-emerald-700 block font-semibold">
                    {isFr ? `Centre de Contrôle : ${report.headline}` : `Control Center: ${report.headline}`}
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 print:border-amber-700">
                  <Shield className="w-4 h-4 text-amber-400 print:text-amber-700" />
                  <span className="text-[10px] font-black uppercase text-amber-300 print:text-amber-800">
                    PuffinLess Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
