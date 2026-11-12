import React, { useState, useMemo, useRef } from 'react';
import {
  X, User, Volume2, Sparkles, Trash2, Sun, Moon, Briefcase,
  Flame, Brain, Check, ChevronRight, Activity, Shield, Camera, Upload, Smartphone,
  Lock, Download, RefreshCw
} from 'lucide-react';
import type { UserProfile, QuitMode, AppTheme, Language, SubstanceType, QuitGoal } from '../types';
import { sound } from '../utils/audio';
import {
  downloadUserDataJSON,
} from '../utils/storage';
import {
  getSecurityConfig,
  saveSecurityConfig,
} from '../utils/security';
import { PrivacyTermsModal } from './PrivacyTermsModal';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => Promise<void> | void;
  onRerunOnboarding: (step?: number) => void;
  onResetData: () => Promise<void> | void;
  onRecoverData?: () => Promise<any>;
  onImportData?: (jsonStr: string) => Promise<any>;
  onOpenPrivacyTerms?: () => void;
}

const PRESET_AVATARS = [
  {
    id: 'african-man',
    labelEn: 'African Black Man',
    labelFr: 'Homme Africain',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'african-woman',
    labelEn: 'African Black Woman',
    labelFr: 'Femme Africaine',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'black-man-2',
    labelEn: 'Black Man',
    labelFr: 'Homme Noir',
    url: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'black-dark-woman',
    labelEn: 'Dark-Skinned Black Woman',
    labelFr: 'Femme Noire Teint Ébène',
    url: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'arabian-man',
    labelEn: 'Arabian / Middle Eastern Man',
    labelFr: 'Homme Oriental / Moyen-Orient',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'asian-woman',
    labelEn: 'Asian Woman',
    labelFr: 'Femme Asiatique',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'asian-man',
    labelEn: 'Asian Man',
    labelFr: 'Homme Asiatique',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'arabian-woman',
    labelEn: 'Arabian / Mediterranean Woman',
    labelFr: 'Femme Orientale / Méditerranéenne',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onRerunOnboarding,
  onResetData,
  onRecoverData,
  onImportData,
  onOpenPrivacyTerms,
}) => {
  // Language & Theme
  const [lang, setLang] = useState<Language>(profile.language || 'en');
  const [theme, setTheme] = useState<AppTheme>(profile.theme || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);

  // Identity & Life Context - Default avatar is the neutral artistic portrait; fields start blank
  const [avatar, setAvatar] = useState(
    profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name || '');
  const [age, setAge] = useState<number | ''>(profile.age ? profile.age : '');
  const [gender, setGender] = useState(profile.gender || 'Prefer not to say');
  const [coreValue, setCoreValue] = useState(profile.customCoachGoal || '');
  const [job, setJob] = useState(profile.job || '');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>(profile.monthlyIncome ? profile.monthlyIncome : '');
  const [currency, setCurrency] = useState(profile.currency || '$');
  const [quitGoal, setQuitGoal] = useState<QuitGoal>(profile.quitGoal || 'want_to_quit');

  // Substance Habits
  const [habits, setHabits] = useState<SubstanceType[]>(
    profile.habits || ['cigarette', 'puff_vape']
  );
  const [primarySubstance, setPrimarySubstance] = useState<SubstanceType>(
    profile.primarySubstance || 'cigarette'
  );

  // Daily Habits
  const [cigsPerDay, setCigsPerDay] = useState<number | ''>(profile.cigarettesPerDay || '');
  const [pricePerPack, setPricePerPack] = useState<number | ''>(profile.pricePerPack || '');
  const [puffsPerDay, setPuffsPerDay] = useState<number | ''>(profile.puffsPerDay || '');
  const [podPrice, setPodPrice] = useState<number | ''>(profile.podPrice ?? '');
  const [cannabisGrams, setCannabisGrams] = useState<number | ''>(profile.cannabisGramsPerWeek || '');
  const [pricePerGram, setPricePerGram] = useState<number | ''>(profile.pricePerGram ?? '');
  const [yearsSmoking, setYearsSmoking] = useState<number | ''>(profile.smokingHabitByDay?.yearsSmoking ?? '');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(
    profile.smokingHabitByDay?.peakTriggers || ['Stress', 'After meal', 'Work break']
  );

  const [quitMode, setQuitMode] = useState<QuitMode>(profile.quitMode || 'cold_turkey');
  // Default clean start date is blank unless user explicitly entered a custom date
  const [quitDate, setQuitDate] = useState(() =>
    profile.customQuitDate && profile.quitDate ? profile.quitDate.substring(0, 10) : ''
  );

  const [confirmReset, setConfirmReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // App Lock PIN security state
  const [securityEnabled, setSecurityEnabled] = useState(() => getSecurityConfig().enabled);
  const [securityPin, setSecurityPin] = useState(() => (getSecurityConfig().pinHash ? '••••' : ''));

  // Local Device Recovery state
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // Standalone Privacy Policy & Terms Modal state
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);

  const isFr = lang === 'fr';

  const handleRecoverData = async () => {
    if (!onRecoverData) return;
    setIsRecovering(true);
    setRecoveryMessage(null);
    try {
      sound.playClick();
      const res = await onRecoverData();
      if (res && res.hasNewlyRecoveredData) {
        sound.playCelebration();
        setRecoveryMessage(
          isFr
            ? `✓ ${res.newlyRecovered?.total || 0} élément(s) restauré(s) (${res.stats?.streaksCount || 0} séries, ${res.stats?.cravingsCount || 0} victoires, ${res.stats?.substancesCount || 0} consommations). Intégrité : 100% vérifiée.`
            : `✓ ${res.newlyRecovered?.total || 0} historical item(s) restored (${res.stats?.streaksCount || 0} streaks, ${res.stats?.cravingsCount || 0} victories, ${res.stats?.substancesCount || 0} logs). Integrity: 100% verified.`
        );
      } else if (res && res.recovered) {
        setRecoveryMessage(
          isFr
            ? `✓ Toutes vos données sont déjà saines et synchronisées (${res.stats?.cravingsCount || 0} victoires, ${res.stats?.streaksCount || 0} séries). Aucun élément manquant.`
            : `✓ All your data is already healthy and synchronized (${res.stats?.cravingsCount || 0} victories, ${res.stats?.streaksCount || 0} streaks). 0 items missing.`
        );
      } else {
        setRecoveryMessage(
          isFr
            ? 'Aucune donnée antérieure détectée sur cet appareil.'
            : 'No previous data detected on this device.'
        );
      }
    } catch (err) {
      console.error('[ProfileModal] Recovery error:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setRecoveryMessage(
        isFr
          ? `✕ Échec du scan de récupération : ${detail}`
          : `✕ Recovery scan failed: ${detail}`
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    sound.playClick();
    setIsExporting(true);
    try {
      await downloadUserDataJSON();
      setRecoveryMessage(
        isFr ? '✓ Sauvegarde exportée avec succès.' : '✓ Backup exported successfully.'
      );
    } catch (err) {
      console.error('[ProfileModal] Error exporting data:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setRecoveryMessage(
        isFr ? `✕ Échec de l'exportation : ${detail}` : `✕ Export failed: ${detail}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportData) return;
    setIsImporting(true);
    setRecoveryMessage(null);
    try {
      sound.playClick();
      const text = await file.text();
      const res = await onImportData(text);
      if (res && res.success) {
        sound.playCelebration();
        setRecoveryMessage(
          isFr
            ? `✓ Sauvegarde restaurée avec succès : ${res.imported?.substanceLogsCount || 0} logs, ${res.imported?.cravingsCount || 0} envies et ${res.imported?.streaksCount || 0} séries réintégrées.`
            : `✓ Backup restored successfully: ${res.imported?.substanceLogsCount || 0} logs, ${res.imported?.cravingsCount || 0} cravings, and ${res.imported?.streaksCount || 0} streaks restored.`
        );
      } else {
        setRecoveryMessage(
          `✕ ${res?.message || (isFr ? 'Impossible de restaurer ce fichier.' : 'Unable to restore this backup file.')}`
        );
      }
    } catch (err) {
      console.error('[ProfileModal] Error importing backup:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setRecoveryMessage(
        isFr ? `✕ Erreur lors de la lecture du fichier : ${detail}` : `✕ Error reading backup file: ${detail}`
      );
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Toggle habit checkbox
  const toggleHabit = (sub: SubstanceType) => {
    let next: SubstanceType[];
    if (habits.includes(sub)) {
      if (habits.length === 1) return; // Keep at least one
      next = habits.filter((h) => h !== sub);
      if (primarySubstance === sub) {
        setPrimarySubstance(next[0]);
      }
    } else {
      next = [...habits, sub];
    }
    setHabits(next);
  };

  const toggleTrigger = (trig: string) => {
    if (selectedTriggers.includes(trig)) {
      setSelectedTriggers(selectedTriggers.filter((t) => t !== trig));
    } else {
      setSelectedTriggers([...selectedTriggers, trig]);
    }
  };

  // Financial calculations
  const monthlyCostEstimate = useMemo(() => {
    let cost = 0;
    if (habits.includes('cigarette')) {
      cost += ((Number(cigsPerDay) || 0) / 20) * (Number(pricePerPack) || 12) * 30.5;
    }
    if (habits.includes('puff_vape')) {
      cost += ((Number(puffsPerDay) || 0) / 600) * (Number(podPrice) || 18) * 30.5;
    }
    if (habits.includes('cannabis')) {
      cost += ((Number(cannabisGrams) || 0) / 7) * (Number(pricePerGram) || 10) * 30.5;
    }
    return Math.round(cost);
  }, [habits, cigsPerDay, pricePerPack, puffsPerDay, podPrice, cannabisGrams, pricePerGram]);

  const incomePercent = useMemo(() => {
    const inc = Number(monthlyIncome) || 0;
    if (inc <= 0) return 0;
    return Math.round((monthlyCostEstimate / inc) * 100);
  }, [monthlyCostEstimate, monthlyIncome]);

  // Dynamic AI coach analysis preview
  const coachAnalysis = useMemo(() => {
    const userName = name.trim() || (isFr ? 'Ami' : 'Friend');
    const subLabel =
      primarySubstance === 'cigarette'
        ? isFr ? 'la cigarette traditionnelle' : 'traditional cigarettes'
        : primarySubstance === 'puff_vape'
        ? isFr ? 'les puffs électroniques' : 'nicotine vape puffs'
        : isFr ? 'le cannabis / weed' : 'cannabis / weed';

    const careerImpact = isFr
      ? `Dans votre domaine (${job || 'professionnel'}), l'arrêt de ${subLabel} éliminera le brouillard mental de l'après-midi, améliorera votre concentration soutenue et stabilisera votre rythme veille-sommeil.`
      : `In your career (${job || 'professional life'}), conquering ${subLabel} will eliminate mid-day dopamine crashes, supercharge your focus, and stabilize your sustained energy.`;

    const wealthImpact = isFr
      ? `Vous libérerez ${currency}${monthlyCostEstimate}/mois (${incomePercent}% de vos revenus nets), soit ${currency}${(monthlyCostEstimate * 12).toLocaleString()} par an réinjectés dans vos vrais projets de vie.`
      : `You will liberate ${currency}${monthlyCostEstimate}/month (${incomePercent}% of your net income), redirecting ${currency}${(monthlyCostEstimate * 12).toLocaleString()} per year directly into your true life aspirations.`;

    const spiritualMindset = isFr
      ? coreValue
        ? `En accord avec votre motivation ("${coreValue}"), reprendre la maîtrise sur vos pulsions réaligne votre quotidien avec vos priorités.`
        : `Retrouver la souveraineté sur vos impulsions réaligne votre quotidien avec votre véritable potentiel intérieur.`
      : coreValue
        ? `Aligning with your core purpose ("${coreValue}"), taking back sovereignty over impulses restores daily clarity and focus.`
        : `Taking back full sovereignty over chemical impulses liberates your mind and restores your daily mental clarity.`;

    return {
      title: isFr ? `Plan de Coaching Sur-Mesure pour ${userName}` : `Custom AI Coach Blueprint for ${userName}`,
      careerImpact,
      wealthImpact,
      spiritualMindset,
    };
  }, [name, primarySubstance, job, coreValue, monthlyCostEstimate, incomePercent, currency, isFr]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
        } else {
          setAvatar(rawDataUrl);
        }
        sound.playClick();
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      // Fundamental Rule: Every save DOES NOT change the started timer.
      // As default the app starts the count from the day it is used unless a specific date is entered by the user.
      let finalQuitDate = '';
      let finalCustomQuitDate = false;

      if (quitDate.trim() === '') {
        // User left date blank or clicked "✕ Vierge"
        // Revert to original app installation date (profile.createdAt)
        finalQuitDate = profile.createdAt || new Date().toISOString();
        finalCustomQuitDate = false;
      } else {
        // User entered an explicit specific date
        if (profile.quitDate && profile.quitDate.startsWith(quitDate)) {
          finalQuitDate = profile.quitDate; // Keep exact time of day if date was unchanged
        } else {
          finalQuitDate = new Date(quitDate + 'T00:00:00').toISOString();
        }
        finalCustomQuitDate = true;
      }

      const updated: UserProfile = {
        ...profile,
        name: name.trim() || 'Champion',
        avatar,
        language: lang,
        theme,
        soundEnabled,
        currency,
        quitGoal,
        age: Number(age) || 0,
        gender,
        ethnicity: '',
        religion: '',
        customCoachGoal: coreValue.trim(),
        job: job.trim(),
        monthlyIncome: Number(monthlyIncome) || 0,
        habits,
        primarySubstance,
        cigarettesPerDay: Number(cigsPerDay) || 0,
        pricePerPack: Number(pricePerPack) || 12,
        puffsPerDay: Number(puffsPerDay) || 0,
        podPrice: Number(podPrice) || 18,
        cannabisGramsPerWeek: Number(cannabisGrams) || 0,
        pricePerGram: Number(pricePerGram) || 10,
        smokingHabitByDay: {
          cigarettes: Number(cigsPerDay) || 0,
          puffs: Number(puffsPerDay) || 0,
          cannabis: Number(cannabisGrams) || 0,
          yearsSmoking: Number(yearsSmoking) || 0,
          peakTriggers: selectedTriggers,
        },
        quitMode,
        quitDate: finalQuitDate,
        customQuitDate: finalCustomQuitDate,
        createdAt: profile.createdAt || finalQuitDate,
        updatedAt: new Date().toISOString(),
      };

      sound.setEnabled(soundEnabled);
      sound.playClick();
      saveSecurityConfig(
        securityEnabled,
        securityPin === '••••' ? undefined : securityPin.trim()
      );
      await onSaveProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('[ProfileModal] Error saving profile:', err);
      setSaveError(
        isFr
          ? "Erreur lors de l'enregistrement. Veuillez vérifier l'espace disponible."
          : "Error saving profile. Please check device storage."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setResetError(null);
    setIsResetting(true);
    try {
      await onResetData();
      onClose();
    } catch (err) {
      console.error('[ProfileModal] Data erasure error:', err);
      setResetError(
        isFr
          ? 'Échec de la suppression définitive. Veuillez fermer les autres onglets et réessayer.'
          : 'Failed to confirm data deletion. Please close other tabs and try again.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  const triggerOptions = [
    { id: 'Stress', labelEn: 'Stress & Pressure', labelFr: 'Stress & Pression' },
    { id: 'Avant / Après repas', labelEn: 'Before / After Meals', labelFr: 'Avant / Après repas' },
    { id: 'Café / Matin', labelEn: 'Coffee / Morning', labelFr: 'Café / Matin' },
    { id: 'Soirée détente', labelEn: 'Relaxing Evening', labelFr: 'Soirée détente' },
    { id: 'Sport', labelEn: 'Workout / Sport', labelFr: 'Sport' },
    { id: 'Work break', labelEn: 'Work & Screen Break', labelFr: 'Pause travail' },
    { id: 'Social drinks', labelEn: 'Social / Alcohol', labelFr: 'Soirées / Alcool' },
    { id: 'Boredom', labelEn: 'Boredom / Driving', labelFr: 'Ennui / Conduite' },
    { id: 'Autre', labelEn: 'Other', labelFr: 'Autre' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div className="settings-modal relative w-full max-w-lg rounded-3xl glass-panel-elevated p-5 sm:p-7 border border-white/15 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          aria-label={isFr ? 'Fermer les paramètres' : 'Close settings'}
          className="absolute top-5 right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={isFr ? 'Changer de photo de profil' : 'Change profile picture'}
            aria-label={isFr ? 'Changer la photo de profil' : 'Change profile picture'}
            className="relative cursor-pointer group p-0 border-0 bg-transparent text-left"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 bg-slate-900">
              <img
                src={avatar}
                alt={name || 'User avatar'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </button>

          <div className="min-w-0 pr-8">
            <div className="flex items-center gap-2">
              <h3 id="profile-modal-heading" className="text-lg font-bold text-white tracking-tight truncate">
                {name || (isFr ? 'Profil Utilisateur' : 'User Profile')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isFr ? 'Coach Actif' : 'Coach Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {isFr ? 'Personnalisation IA de votre parcours et de vos habitudes' : 'AI Personalization of your lifestyle & habits'}
            </p>
          </div>
        </div>

        {/* Quick Language Toggle Bar at the very top of settings */}
        <div className="mb-4 p-2 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 pl-2">
            <span className="text-xs font-semibold text-slate-300">
              {isFr ? 'Langue de l\'application' : 'Application Language'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setLang('en');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'en'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇺🇸</span>
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setLang('fr');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === 'fr'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇫🇷</span>
              <span>Français</span>
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable from up to down */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
          {/* SECTION 1: IDENTITY & LIFE CONTEXT */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFr ? '1. Identité & Profil Personnel' : '1. Personal Identity & Profile'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Objectif, photo, nom et situation personnelle' : 'Goal, picture, name, and personal context'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {isFr
                    ? 'Ces informations restent 100% privées sur votre appareil. Elles permettent au Centre de Contrôle de calibrer des conseils psychologiques et financiers adaptés à votre réalité.'
                    : 'This information stays 100% private on your device. It allows the Control Center to personalize psychological and financial coaching to your exact life.'}
                </span>
              </div>

              {/* OBJECTIVE SELECTOR */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                <label className="block text-xs font-bold text-emerald-400">
                  🎯 {isFr ? 'Votre Objectif Principal' : 'Your Main Objective'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'want_to_quit' as QuitGoal, labelFr: 'Je veux arrêter', labelEn: 'Want to quit', icon: '🎯' },
                    { id: 'already_quit' as QuitGoal, labelFr: 'Déjà arrêté', labelEn: 'Already quit', icon: '🛡️' },
                    { id: 'just_tracking' as QuitGoal, labelFr: 'Suivi simple', labelEn: 'Just tracking', icon: '📊' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setQuitGoal(g.id);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                        quitGoal === g.id
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                          : 'bg-black/30 border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{g.icon}</span>
                      <span className="text-[10px] text-center font-bold leading-tight">{isFr ? g.labelFr : g.labelEn}</span>
                    </button>
                  ))}
                </div>
                {quitGoal === 'just_tracking' && (
                  <p className="text-[10px] text-teal-300 italic">
                    ℹ️ {isFr
                      ? 'Mode suivi actif : la date d\'arrêt est optionnelle. L\'application s\'adapte à la réduction progressive sans pression de rechute.'
                      : 'Tracking mode active: clean start date is optional. The app focuses on habit reduction without relapse pressure.'}
                  </p>
                )}
              </div>

              {/* AVATAR SELECTOR & LOCAL PHOTO UPLOAD */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFr ? 'Photo de profil' : 'Profile picture'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isFr ? 'Importer photo' : 'Upload photo'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* 8 Avatar Presets arranged as 2 lines of 4 */}
                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {PRESET_AVATARS.map((p) => {
                    const isSelected = avatar === p.url;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar(p.url);
                        }}
                        title={isFr ? p.labelFr : p.labelEn}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105 shadow-md shadow-emerald-500/30'
                            : 'border-white/10 opacity-75 hover:opacity-100 hover:border-white/30 hover:scale-102'
                        }`}
                      >
                        <img src={p.url} alt={p.id} className="w-full h-full object-cover" />
                        {isSelected && (
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-500/85 py-0.5 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  {isFr ? 'Choisissez un avatar ou importez votre propre photo depuis votre téléphone.' : 'Select a preset style or upload your own picture from your device.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFr ? 'Votre Prénom / Surnom' : 'Your Name / Handle'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isFr ? 'Ex: Thomas, Sarah...' : 'e.g. Alex, Jordan...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFr ? 'Âge' : 'Age'}
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder={isFr ? 'Ex: 28' : 'e.g. 28'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFr ? 'Genre' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Male">{isFr ? 'Homme' : 'Male'}</option>
                    <option value="Female">{isFr ? 'Femme' : 'Female'}</option>
                    <option value="Non-Binary">{isFr ? 'Non-binaire' : 'Non-Binary'}</option>
                    <option value="Prefer not to say">{isFr ? 'Non spécifié' : 'Prefer not to say'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFr ? 'Devise ou Motivation Personnelle (Optionnel)' : 'Personal Motto or Core Motivation (Optional)'}
                </label>
                <input
                  type="text"
                  value={coreValue}
                  onChange={(e) => setCoreValue(e.target.value)}
                  placeholder={isFr ? 'Ex: Retrouver mon souffle, inspirer mes proches, clarté mentale...' : 'e.g. Health, mental clarity, family, endurance...'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-1 border-t border-white/10">
                <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-emerald-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isFr ? 'Situation Professionnelle & Revenus (Optionnel)' : 'Career & Financial Profile (Optional)'}</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">
                  {isFr
                    ? 'Le revenu est strictement confidentiel et optionnel. Il sert uniquement à évaluer le pouvoir d\'achat libéré et le budget économisé.'
                    : 'Income is purely optional and confidential, used solely to compute your liberated budget and purchasing power.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFr ? 'Métier / Activité' : 'Job / Profession'}
                    </label>
                    <input
                      type="text"
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      placeholder={isFr ? 'Ex: Ingénieur, Artisan, Étudiant...' : 'e.g. Software Engineer, Healthcare, Creative...'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isFr ? 'Revenu Mensuel Net' : 'Monthly Net Income'}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-2.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs font-bold"
                      >
                        <option value="$">$ USD</option>
                        <option value="€">€ EUR</option>
                        <option value="£">£ GBP</option>
                        <option value="C$">C$ CAD</option>
                        <option value="CHF">CHF</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value ? Number(e.target.value) : '')}
                        placeholder={isFr ? 'Ex: 2500' : 'e.g. 2500'}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                {incomePercent > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/70 border border-amber-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      {isFr ? 'Part du revenu actuellement consumée :' : 'Share of income currently burned:'}
                    </span>
                    <span className="font-extrabold text-amber-400 tabular-nums">
                      ~{incomePercent}% ({currency}{monthlyCostEstimate}/mois)
                    </span>
                  </div>
                )}
              </div>
          </div>

          {/* SECTION 2: SUBSTANCE HABITS & DIAGNOSIS */}
          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFr ? '2. Habitudes de Consommation & Objectifs' : '2. Substance Habits & Objectives'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Substances suivies, dépenses, déclencheurs et date d\'arrêt' : 'Tracked substances, spend, triggers, and quit date'}
                </p>
              </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFr ? 'Vos Substances Actuelles (sélection multiple)' : 'Your Current Substances (Multi-select)'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cigarette' as SubstanceType, labelEn: 'Cigarette', labelFr: 'Cigarette', icon: '🚬' },
                    { id: 'puff_vape' as SubstanceType, labelEn: 'Vape / Puff', labelFr: 'Puff / Vape', icon: '💨' },
                    { id: 'cannabis' as SubstanceType, labelEn: 'Cannabis / CBD', labelFr: 'Cannabis / CBD', icon: '🌿' },
                  ].map((item) => {
                    const active = habits.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          toggleHabit(item.id);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          active
                            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                            : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-xs font-bold">{isFr ? item.labelFr : item.labelEn}</span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRIMARY SUBSTANCE SELECTION */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  ⭐ {isFr ? 'Substance Principale (Cible Prioritaire)' : 'Primary Substance (Primary Target)'}
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  {isFr
                    ? 'Le système adaptera les statistiques d\'oxydation, le sevrage et les conseils en fonction de ce choix.'
                    : 'The app adapts pharmacological data, cellular recovery timelines and coaching to this primary habit.'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {habits.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setPrimarySubstance(h);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        primarySubstance === h
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                          : 'bg-black/30 border-white/10 text-slate-300'
                      }`}
                    >
                      {h === 'cigarette' ? '🚬 Cigarette' : h === 'puff_vape' ? '💨 Vape' : '🌿 Cannabis / CBD'}
                    </button>
                  ))}
                </div>
              </div>

              {/* QUANTITIES & EXPENSES */}
              <div className="space-y-3 pt-1">
                {habits.includes('cigarette') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
                    <span className="text-xs font-bold text-slate-200">🚬 {isFr ? 'Paramètres Cigarettes' : 'Cigarette Baseline'}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? 'Cigarettes / jour' : 'Cigarettes / day'}</label>
                        <input
                          type="number"
                          min="0"
                          value={cigsPerDay}
                          onChange={(e) => setCigsPerDay(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="15"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? `Prix paquet (${currency})` : `Pack price (${currency})`}</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={pricePerPack}
                          onChange={(e) => setPricePerPack(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="12.5"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {habits.includes('puff_vape') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
                    <span className="text-xs font-bold text-slate-200">💨 {isFr ? 'Paramètres Vape & Puffs' : 'Vape & Puff Baseline'}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? 'Bouffées / jour' : 'Puffs / day'}</label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={puffsPerDay}
                          onChange={(e) => setPuffsPerDay(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="80"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? `Prix pod 600 puffs (${currency})` : `Pod price (${currency})`}</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={podPrice}
                          onChange={(e) => setPodPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="18"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {habits.includes('cannabis') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
                    <span className="text-xs font-bold text-slate-200">🌿 {isFr ? 'Paramètres Cannabis / CBD' : 'Cannabis / CBD Baseline'}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? 'Grammes / semaine' : 'Grams / week'}</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={cannabisGrams}
                          onChange={(e) => setCannabisGrams(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="3.5"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? `Prix au gramme (${currency})` : `Price / gram (${currency})`}</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={pricePerGram}
                          onChange={(e) => setPricePerGram(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="10"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-[10px] text-slate-400 italic">
                  ℹ️ {isFr
                    ? 'Rappel : ces paramètres servent uniquement à estimer vos économies et vos gains de santé. Ils n\'enregistrent AUCUNE consommation dans votre journal quotidien.'
                    : 'Reminder: these numbers serve as your baseline reference to project savings. They do NOT add any consumed intake to your daily database.'}
                </div>
              </div>

              {/* PEAK TRIGGERS */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFr ? 'Vos Déclencheurs Majeurs de Pulsion' : 'Your Main Habit Triggers'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {triggerOptions.map((trig) => {
                    const active = selectedTriggers.includes(trig.id);
                    return (
                      <button
                        key={trig.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          toggleTrigger(trig.id);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                          active
                            ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                            : 'bg-slate-900/50 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {isFr ? trig.labelFr : trig.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QUIT DATE & MODE */}
              <div className="grid grid-cols-2 gap-2 pt-1 items-start">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1 min-w-0 h-4">
                    <label className="block text-xs font-semibold text-slate-300 truncate">
                      {isFr ? 'Date d\'Arrêt' : 'Clean Date'}
                    </label>
                    {quitDate && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setQuitDate('');
                        }}
                        className="px-1.5 py-0.2 rounded bg-rose-500/20 text-[9px] text-rose-300 hover:bg-rose-500/30 transition-all font-bold shrink-0 leading-tight"
                        title={isFr ? 'Laisser vierge' : 'Leave blank'}
                      >
                        ✕ {isFr ? 'Vierge' : 'Clear'}
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={quitDate}
                    onChange={(e) => setQuitDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={{ minHeight: '34px', maxHeight: '36px' }}
                    className="w-full h-9 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                    {isFr ? 'Vierge par défaut' : 'Blank by default'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1 min-w-0 h-4">
                    <label className="block text-xs font-semibold text-slate-300 truncate">
                      {isFr ? 'Années de Pratique' : 'Years Consumed'}
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={yearsSmoking}
                    onChange={(e) => setYearsSmoking(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    style={{ minHeight: '34px', maxHeight: '36px' }}
                    className="w-full h-9 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block truncate opacity-0 pointer-events-none select-none">
                    {isFr ? 'Vierge par défaut' : 'Blank by default'}
                  </span>
                </div>
              </div>
          </div>

          {/* SECTION 3: AI COACH BLUEPRINT & PERSONALIZED LIFE INTEGRATION */}
          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFr ? '3. Stratégie & Diagnostic Coach IA' : '3. AI Coach Blueprint & Insights'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Analyse personnalisée de votre énergie, finances et mental' : 'Personalized breakdown of stamina, wealth, and focus'}
                </p>
              </div>
            </div>

            <div className="coach-ai-card keep-white p-4 rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{coachAnalysis.title}</h4>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {isFr ? 'Moteur du Centre de Contrôle' : 'Control Center Engine'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-white leading-relaxed">
                  <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {isFr ? 'Impact Professionnel & Énergie' : 'Career & Cognitive Stamina'}
                    </span>
                    <p className="text-white/90">{coachAnalysis.careerImpact}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {isFr ? 'Libération Financière & Pouvoir d\'Achat' : 'Financial Sovereignty'}
                    </span>
                    <p className="text-white/90">{coachAnalysis.wealthImpact}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      {isFr ? 'Maîtrise de Soi & Alignement Mental' : 'Mindset & Self-Mastery'}
                    </span>
                    <p className="text-white/90">{coachAnalysis.spiritualMindset}</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-100">
                  <span className="font-bold text-emerald-300">✨ {isFr ? 'Comment l\'IA vous accompagne au quotidien :' : 'How your coach adapts daily:'}</span>
                  <p className="mt-1 text-emerald-100/90">
                    {isFr
                      ? 'L\'écran d\'accueil, les alertes d\'heures de pointe, les masterclasses et le calcul de vie retrouvée utilisent directement ces paramètres pour vous offrir une aide chirurgicale.'
                      : 'The home screen, danger hour notifications, masterclasses, and biological recovery meters continuously adjust to these specific inputs.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFr ? 'Protocole d\'Arrêt' : 'Quit Protocol'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cold_turkey', labelFr: 'Cold Turkey (Arrêt Net)', labelEn: 'Cold Turkey (Instant 0)' },
                    { id: 'gradual', labelFr: 'Diminution Progressive', labelEn: 'Gradual Tapering' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setQuitMode(m.id as QuitMode)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        quitMode === m.id
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-md'
                          : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isFr ? m.labelFr : m.labelEn}
                    </button>
                  ))}
                </div>
              </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: SYSTEM PREFERENCES & SECURITY                  */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFr ? '4. Préférences & Sécurité Système' : '4. System Preferences & Security'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Thème visuel, sons et verrouillage par code PIN' : 'Visual theme, audio feedback, and PIN protection'}
                </p>
              </div>
            </div>
              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFr ? 'Thème de l\'Application' : 'App Appearance Theme'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-emerald-500/50 text-emerald-300 shadow-md ring-1 ring-emerald-400/30'
                        : 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <span>Luxury Obsidian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      theme === 'light'
                        ? 'bg-white/95 border-emerald-500/50 text-slate-900 shadow-md ring-1 ring-emerald-400/30'
                        : 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Luxury Pearl</span>
                  </button>
                </div>
              </div>

              {/* Sound Audio Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl glass-panel border border-white/10">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isFr ? 'Effets Sonores & Cloches de Méditation' : 'Audio & Meditation Chimes'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {isFr ? 'Sons haptiques Web Audio lors des respirations et succès' : 'Haptic audio feedback on breathing and wins'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      soundEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* 1. Interface Screen Lock (PIN) */}
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isFr ? 'Verrouillage de l\'Interface (Code PIN)' : 'Interface Screen Lock (PIN)'}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {isFr
                          ? 'Verrouille l\'affichage contre les regards indiscrets avec protection renforcée'
                          : 'Locks screen display against snooping with enhanced protection'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSecurityEnabled(!securityEnabled);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      securityEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        securityEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {securityEnabled && (
                  <div className="pt-2 border-t border-white/10 space-y-2 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {isFr ? 'Code PIN d\'accès' : 'Access PIN'}
                      </label>
                      <input
                        type="password"
                        maxLength={8}
                        value={securityPin}
                        onFocus={() => {
                          if (securityPin === '••••') setSecurityPin('');
                        }}
                        onChange={(e) => setSecurityPin(e.target.value)}
                        placeholder={isFr ? 'Ex: 1234' : 'e.g. 1234'}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs tracking-widest focus:outline-none focus:border-emerald-500/50"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {isFr
                          ? 'Ce code PIN sera demandé à chaque réouverture de l\'écran.'
                          : 'This PIN will be requested when unlocking the screen.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Cryptographic Device Security (Military-grade at rest) */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isFr ? 'Protection Militaire des Données' : 'Military-Grade Data Protection'}
                    </span>
                    <span className="text-[11px] text-slate-300 block">
                      {isFr
                        ? 'Protection physique au repos avec sécurité de niveau militaire. Vos informations restent strictement cloisonnées et chiffrées sur votre appareil, sans aucun accès externe.'
                        : 'At-rest physical protection with military-grade security. Your information remains strictly isolated and encrypted on your device, with zero external access.'}
                    </span>
                  </div>
                </div>
              </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 5: SAUVEGARDE & GESTION DES DONNÉES (RGPD)        */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFr ? '5. Sauvegarde & Gestion des Données' : '5. Data Backup & Storage Management'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Gestion du stockage local, export de sauvegarde et réinitialisation' : 'Local storage management, backup export, and reset controls'}
                </p>
              </div>
            </div>

            {/* Important Local Backup Reminder */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] text-amber-200/90 leading-relaxed">
                <span className="font-bold block text-amber-300">
                  {isFr ? 'Rappel de Sauvegarde Importante' : 'Important Backup Reminder'}
                </span>
                {isFr
                  ? 'Vos données et historiques sont stockés localement sur cet appareil. Pensez à exporter régulièrement un fichier de sauvegarde (.json) pour mettre vos progrès à l’abri en cas de changement d’appareil ou de nettoyage du navigateur.'
                  : 'Your data and streak logs are stored locally on this device. Remember to periodically export a backup file (.json) to protect your journey against device changes or browser cache wipes.'}
              </div>
            </div>

            {/* Mode Récupération & Restauration Locale */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFr ? 'Mode Récupération & Restauration Locale' : 'Local Device Recovery & Restore'}
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    {isFr
                      ? 'Analyse votre appareil pour retrouver et restaurer votre profil, vos jours d\'abstinence et votre historique enregistré.'
                      : 'Deep-scans your device to locate and restore your profile, smoke-free days, and your saved history.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    disabled={isRecovering}
                    onClick={handleRecoverData}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
                    <span>{isRecovering ? (isFr ? 'Scan...' : 'Scanning...') : (isFr ? 'Récupérer mes données' : 'Recover Data')}</span>
                  </button>
                </div>
              </div>
              {recoveryMessage && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-semibold leading-relaxed flex items-start gap-2 ${
                    recoveryMessage.startsWith('✓')
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : recoveryMessage.startsWith('✕') || recoveryMessage.startsWith('⚠️')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  <span>{recoveryMessage}</span>
                </div>
              )}
            </div>

            {/* Save & Restore Data Section (Export & Import JSON) */}
            <div className="p-3.5 rounded-2xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isFr ? 'Sauvegarder & Restaurer les Données (JSON)' : 'Save & Restore All Data (JSON)'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {isFr
                      ? 'Exportez une copie de secours sur votre appareil ou restaurez un fichier existant à tout moment.'
                      : 'Export a backup copy to your device or restore an existing backup file at any time.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={importFileInputRef}
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isImporting || !onImportData}
                    onClick={() => importFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
                        <span>{isFr ? 'Restauration...' : 'Restoring...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isFr ? 'Importer' : 'Import'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
                        <span>{isFr ? 'Exportation...' : 'Exporting...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>{isFr ? 'Exporter' : 'Export'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Data Section */}
            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div>
                <span className="text-xs font-bold text-rose-300 block">
                  {isFr ? 'Réinitialisation & Suppression Locale des Données' : 'Local Reset & Data Deletion'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isFr
                    ? 'Efface la base de données locale, le journal et les clés de chiffrement de ce navigateur. Note : cela n\'efface pas les fichiers de sauvegarde (.json) déjà enregistrés sur votre disque, ni les sessions sur d\'autres appareils.'
                    : 'Clears the local database, journal, and encryption keys within this specific browser. Note: does not delete .json backup files already saved to your disk, nor does it affect records in other browsers or devices.'}
                </span>
              </div>

              {resetError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-medium">
                  {resetError}
                </div>
              )}

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isFr ? 'Réinitialiser les données de ce navigateur' : 'Reset Local Browser Data'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleConfirmReset}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer hover:bg-rose-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isResetting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isFr ? 'Suppression en cours...' : 'Erasing data...'}</span>
                      </>
                    ) : (
                      <span>{isFr ? 'Confirmer la Réinitialisation Locale' : 'Confirm Local Reset'}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => {
                      setConfirmReset(false);
                      setResetError(null);
                    }}
                    className="px-3 py-2 rounded-xl glass-button text-xs text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                  >
                    {isFr ? 'Annuler' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 6: GUIDES D'UTILISATION & INSTALLATION PWA        */}
          {/* ========================================================= */}
          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isFr ? '6. Guides d\'Utilisation & Installation PWA' : '6. User Guides & PWA Installation'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Visite guidée interactive et astuces pour fixer l\'app sur l\'écran d\'accueil' : 'Interactive onboarding tour and tips to install as standalone mobile app'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRerunOnboarding(1);
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 hover:text-white transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-white block text-xs">
                      {isFr ? 'Visite Guidée' : 'Onboarding Tour'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isFr ? 'Outils clés & arsenal' : 'Key tools walkthrough'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (onOpenPrivacyTerms) {
                    onOpenPrivacyTerms();
                  } else {
                    setIsPrivacyTermsOpen(true);
                  }
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 hover:text-white transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-white block text-xs">
                      {isFr ? 'Protection des Données' : 'Privacy & Terms'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isFr ? 'Politique complète & conditions' : 'Full policy & terms of service'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRerunOnboarding(4);
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 hover:text-white transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-white block text-xs">
                      {isFr ? 'Guide PWA' : 'PWA Install'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isFr ? 'Écran d\'accueil mobile' : 'Mobile home screen'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Primary Action Button (Always visible at bottom) */}
          <div className="pt-3 border-t border-white/10 shrink-0 space-y-2">
            {saveError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 text-center font-medium">
                {saveError}
              </div>
            )}
            <button
              id="settings-save-button"
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
              className="btn-settings-save w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 !bg-emerald-600 !text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="!text-white font-bold">{isFr ? 'Enregistrement sécurisé...' : 'Saving safely...'}</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 !text-white" />
                  <span className="!text-white font-bold">{isFr ? 'Profil et Coach Enregistrés !' : 'Profile & Coach Updated!'}</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 !text-white" />
                  <span className="!text-white font-bold">
                    {isFr ? 'Enregistrer & Activer le Coach Personnalisé' : 'Save & Calibrate AI Coach'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <PrivacyTermsModal
        isOpen={isPrivacyTermsOpen}
        onClose={() => setIsPrivacyTermsOpen(false)}
        language={isFr ? 'fr' : 'en'}
      />
    </div>
  );
};
