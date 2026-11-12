import React, { useState } from 'react';
import { X, Shield, FileText, Database, AlertTriangle, Download, RefreshCw, Server, Lock } from 'lucide-react';
import { sound } from '../utils/audio';
import type { Language } from '../types';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  language: initialLang = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLang);
  const [activeSection, setActiveSection] = useState<'privacy' | 'terms' | 'deletion' | 'disclaimer'>('privacy');

  if (!isOpen) return null;

  const isFr = lang === 'fr';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-terms-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl p-3 sm:p-6 flex items-center justify-center min-h-screen animate-fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel-elevated border border-white/15 shadow-2xl shadow-emerald-950/40 text-left my-auto max-h-[92vh] flex flex-col overflow-hidden bg-slate-950/95">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className="p-4 sm:p-6 pb-3 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="privacy-terms-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isFr ? 'Politique de Confidentialité & Conditions' : 'Privacy Policy & Terms of Service'}
              </h2>
              <span className="text-[11px] text-slate-400 block">
                {isFr ? 'Transparence des données & cadre d\'utilisation' : 'Data transparency & terms of use'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900/80 border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => { sound.playClick(); setLang('fr'); }}
                className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  isFr ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇫🇷</span>
                <span className="text-[10px]">FR</span>
              </button>
              <button
                type="button"
                onClick={() => { sound.playClick(); setLang('en'); }}
                className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  !isFr ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span className="text-[10px]">EN</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => { sound.playClick(); onClose(); }}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white cursor-pointer ml-1"
              aria-label={isFr ? 'Fermer' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SECTION TABS */}
        <div className="flex overflow-x-auto p-2 bg-slate-900/60 border-b border-white/10 gap-1 shrink-0 no-scrollbar">
          {[
            { id: 'privacy' as const, labelFr: 'Confidentialité', labelEn: 'Privacy', icon: Lock },
            { id: 'terms' as const, labelFr: 'Conditions & Multi-Appareils', labelEn: 'Terms & Devices', icon: FileText },
            { id: 'deletion' as const, labelFr: 'Export & Suppression', labelEn: 'Export & Reset', icon: Download },
            { id: 'disclaimer' as const, labelFr: 'Avertissement Santé', labelEn: 'Health Notice', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { sound.playClick(); setActiveSection(tab.id); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isFr ? tab.labelFr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* TAB 1: PRIVACY & HOSTING */}
          {activeSection === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isFr ? 'Stockage Local des Enregistrements Personnels' : 'Local Storage of Personal Records'}
                  </h3>
                  <p className="mt-1">
                    {isFr
                      ? 'Toutes vos données d\'utilisation personnelle — y compris vos consommations enregistrées, envies surmontées, notes financières, journaux de sommeil et dates d\'abstinence — sont conservées directement et exclusivement dans la mémoire de votre appareil (via les technologies de stockage de votre navigateur, IndexedDB et localStorage).'
                      : 'All your personal usage records — including logged intake, resisted cravings, financial estimates, sleep logs, and streak dates — are stored directly and exclusively on your personal device (using standard browser technologies, IndexedDB and localStorage).'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Server className="w-4 h-4 text-teal-400" />
                  <span>{isFr ? 'Hébergement Web & Métadonnées Réseau' : 'Web Hosting & Network Metadata'}</span>
                </div>
                <p>
                  {isFr
                    ? 'Lorsque vous accédez à PuffinLess via un navigateur web, le chargement initial de l\'application et des fichiers statiques (scripts, feuilles de style, polices) implique l\'échange standard de métadonnées de connexion réseau (telles que votre adresse IP, l\'agent utilisateur de votre navigateur et les en-têtes HTTP de requête) nécessaires à l\'acheminement technique des pages par l\'infrastructure d\'hébergement.'
                    : 'When accessing PuffinLess through a web browser, initially downloading application assets (scripts, stylesheets, fonts) naturally involves standard network connection metadata (such as your IP address, browser user-agent, and HTTP request headers) necessary for the hosting infrastructure to deliver web pages.'}
                </p>
                <p>
                  {isFr
                    ? 'Toutefois, PuffinLess ne possède aucune base de données centrale hébergeant vos habitudes. Vos journaux personnels ne sont pas envoyés ni collectés sur des serveurs distants.'
                    : 'However, PuffinLess maintains no centralized cloud database for your habit history. Your personal logs and entries are neither collected nor stored on remote servers.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>{isFr ? 'Absence de Comptes & Pas de Tiers' : 'No User Accounts & No Third-Party Data Transmission'}</span>
                </div>
                <p>
                  {isFr
                    ? 'PuffinLess ne vous impose aucun compte utilisateur, aucune adresse e-mail et aucun mot de passe pour fonctionner. L\'application n\'intègre aucun traceur publicitaire, régie marketing ou cookie tiers. PuffinLess ne transmet pas intentionnellement vos journaux personnels ou historiques de consommation à des tiers, employeurs, assureurs ou courtiers en données.'
                    : 'PuffinLess does not require user accounts, email registration, or passwords. The application contains no advertising trackers, marketing pixels, or third-party tracking cookies. PuffinLess does not intentionally transmit your personal logs or consumption history to third parties, employers, insurance providers, or data brokers.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE & CROSS-DEVICE */}
          {activeSection === 'terms' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <h3 className="font-bold text-white text-sm">
                  {isFr ? 'Licence d\'Utilisation Personnelle' : 'Personal Usage License'}
                </h3>
                <p>
                  {isFr
                    ? 'PuffinLess vous accorde une licence personnelle, non exclusive et non transférable pour utiliser l\'application comme outil d\'accompagnement d\'habitudes sur vos appareils personnels compatibles.'
                    : 'PuffinLess grants you a personal, non-exclusive, and non-transferable license to use the application as a habit self-monitoring companion on your compatible personal devices.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <RefreshCw className="w-4 h-4" />
                  <span>{isFr ? 'Fonctionnement Multi-Appareils (Export & Import)' : 'Cross-Device Use (Export & Import)'}</span>
                </div>
                <p>
                  {isFr
                    ? 'PuffinLess ne disposant pas de synchronisation cloud automatique ni de compte centralisé, vos données ne transitent pas automatiquement d\'un appareil à un autre. Pour utiliser ou transférer votre historique sur un autre appareil (par exemple de votre ordinateur vers votre smartphone), vous devez exporter manuellement un fichier de sauvegarde (.json) depuis le premier appareil et l\'importer sur le second via les Paramètres.'
                    : 'Because PuffinLess operates without automated cloud synchronization or centralized accounts, your data does not automatically move across devices. To transfer your history to another device (e.g. from a desktop computer to a smartphone), you must manually export a backup file (.json) from the first device and import it on the second via Settings.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <h3 className="font-bold text-white text-xs">
                  {isFr ? 'Limitation de Responsabilité sur le Matériel' : 'Device Storage Responsibility'}
                </h3>
                <p>
                  {isFr
                    ? 'Comme vos données sont hébergées uniquement sur votre appareil personnel, vous êtes responsable de la réalisation périodique de sauvegardes exportées (.json). La perte de votre appareil, un dommage physique, ou la purge totale des données du navigateur par un nettoyeur de disque externe sans sauvegarde peut rendre vos enregistrements locaux irrécupérables.'
                    : 'Because your data resides solely on your physical device, you are responsible for maintaining periodic exported backups (.json). Physical damage, device loss, or browser storage wipes by third-party cleaners without an exported backup may render local records unrecoverable.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP, RESTORE & DELETION LIMITATIONS */}
          {activeSection === 'deletion' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isFr ? 'Exportation & Sauvegarde des Données' : 'Data Export & Backup'}</span>
                </div>
                <p>
                  {isFr
                    ? 'Vous pouvez à tout moment exporter une copie complète de vos données au format standard JSON depuis les Paramètres. Ce fichier peut être conservé sur votre disque local, envoyé sur votre espace de stockage personnel, ou utilisé pour restaurer vos informations à tout moment.'
                    : 'You may export a complete copy of your records in standard JSON format at any time from Settings. This file can be saved to local storage, archived in your personal backup vault, or used to restore your information whenever needed.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{isFr ? 'Portée Précise et Limites de la Réinitialisation' : 'Reset Scope & Deletion Limitations'}</span>
                </div>
                <p>
                  {isFr
                    ? 'Le bouton de réinitialisation ("Supprimer toutes mes données") exécute une suppression ciblée au niveau du navigateur actif :'
                    : 'The reset operation ("Erase All My Data") performs a targeted erasure at the level of the active browser:'}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  <li>
                    <b className="text-white">{isFr ? 'Ce qui est effacé :' : 'What is deleted:'}</b>{' '}
                    {isFr
                      ? 'La base IndexedDB locale, le journal d\'événements, le miroir de stockage localStorage et les clés de chiffrement de ce navigateur.'
                      : 'The local IndexedDB database, event journal, localStorage mirror, and encryption keys within this specific browser profile.'}
                  </li>
                  <li>
                    <b className="text-white">{isFr ? 'Fichiers exportés préalablement :' : 'Previously exported files:'}</b>{' '}
                    {isFr
                      ? 'La réinitialisation n\'efface PAS les fichiers de sauvegarde (.json) que vous avez déjà téléchargés sur votre disque dur ou stockés ailleurs. Il vous appartient de les supprimer manuellement si vous souhaitez vous en défaire.'
                      : 'Resetting does NOT delete backup files (.json) previously downloaded to your hard drive or external storage. You must delete these files manually if you wish to remove them.'}
                  </li>
                  <li>
                    <b className="text-white">{isFr ? 'Autres navigateurs ou appareils :' : 'Other browsers or devices:'}</b>{' '}
                    {isFr
                      ? 'Si vous avez utilisé PuffinLess sur un autre navigateur, une fenêtre privée distincte ou un autre appareil, ces copies distinctes ne sont pas affectées et doivent être réinitialisées séparément.'
                      : 'If you have accessed PuffinLess on another browser, separate incognito profile, or different device, those copies are unaffected and must be reset separately.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: HEALTH & NON-MEDICAL DISCLAIMER */}
          {activeSection === 'disclaimer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>{isFr ? 'Avertissement : Outil d\'Accompagnement Non Médical' : 'Notice: Non-Medical Habit Companion'}</span>
                </div>
                <p className="leading-relaxed">
                  {isFr
                    ? 'PuffinLess est une application d\'auto-mesure, de suivi d\'habitudes et de soutien motivationnel conçue pour aider les utilisateurs dans leur démarche personnelle de réduction ou d\'arrêt de la cigarette, de la vape ou du cannabis.'
                    : 'PuffinLess is a personal habit tracker, self-monitoring tool, and motivational companion designed to support individuals in tracking their journey with cigarettes, vapes, or cannabis.'}
                </p>
                <p className="leading-relaxed font-semibold text-rose-200">
                  {isFr
                    ? 'PuffinLess n\'est PAS un dispositif médical, un service de diagnostic clinique, un cabinet de santé ni un service d\'urgence. L\'application ne fournit aucun avis médical, diagnostic, prescription ou protocole thérapeutique de substitution.'
                    : 'PuffinLess is NOT a medical device, clinical diagnostic service, healthcare provider, or emergency service. The application does not provide medical advice, clinical diagnosis, prescriptions, or therapeutic protocols.'}
                </p>
                <p className="leading-relaxed">
                  {isFr
                    ? 'Les informations, estimations de coûts et indicateurs de bien-être fournis sont purement indicatifs et basés sur vos propres déclarations. En cas de symptômes de sevrage sévères, de troubles anxieux ou dépressifs marqués, ou pour tout besoin d\'assistance médicale, consultez sans délai un professionnel de santé qualifié ou les services d\'urgence de votre région.'
                    : 'All metrics, cost calculations, and wellness indicators are informational self-reports based on your logged inputs. If you experience severe withdrawal symptoms, intense distress, or any health concerns, consult a qualified healthcare professional or local emergency services immediately.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-between text-[11px] text-slate-400">
          <span>{isFr ? 'PuffinLess v2.4 — Novembre 2026' : 'PuffinLess v2.4 — November 2026'}</span>
          <button
            type="button"
            onClick={() => { sound.playClick(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            {isFr ? 'J\'ai Compris' : 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};
