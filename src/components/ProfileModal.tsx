import React, { useState, useMemo, useRef } from 'react';
import {
  X, User, Volume2, Sparkles, Trash2, Sun, Moon, Briefcase,
  Flame, Brain, Check, ChevronRight, Activity, Shield, Camera, Upload
} from 'lucide-react';
import type { UserProfile, QuitMode, AppTheme, Language, SubstanceType } from '../types';
import { sound } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onRerunOnboarding: () => void;
  onResetData: () => void;
}

const PRESET_AVATARS = [
  {
    id: 'male-urban',
    labelEn: 'Urban Modern (M)',
    labelFr: 'Urbain Moderne (H)',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'female-zen',
    labelEn: 'Mindful Chic (F)',
    labelFr: 'Élégance Zen (F)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'creative-art',
    labelEn: 'Creative Arts',
    labelFr: 'Artiste Créatif',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'male-exec',
    labelEn: 'Classic Leader (M)',
    labelFr: 'Leader Classique (H)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'female-radiant',
    labelEn: 'Radiant Glow (F)',
    labelFr: 'Éclat Lumineux (F)',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'athletic-calm',
    labelEn: 'Athletic Calm',
    labelFr: 'Athlète Sérénité',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onRerunOnboarding,
  onResetData,
}) => {
  // Navigation tabs within profile
  const [activeSection, setActiveSection] = useState<'identity' | 'habits' | 'coach' | 'app'>('identity');

  // Language & Theme
  const [lang, setLang] = useState<Language>(profile.language || 'en');
  const [theme, setTheme] = useState<AppTheme>(profile.theme || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);

  // Identity & Life Context
  const [avatar, setAvatar] = useState(profile.avatar || PRESET_AVATARS[1].url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name || '');
  const [age, setAge] = useState<number | ''>(profile.age ?? 28);
  const [gender, setGender] = useState(profile.gender || 'Prefer not to say');
  const [ethnicity, setEthnicity] = useState(profile.ethnicity || 'Global / Mixed');
  const [religion, setReligion] = useState(profile.religion || 'Spiritual / Personal');
  const [job, setJob] = useState(profile.job || 'Creative & Tech Professional');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>(profile.monthlyIncome ?? 3500);
  const [currency, setCurrency] = useState(profile.currency || '$');

  // Substance Habits
  const [habits, setHabits] = useState<SubstanceType[]>(
    profile.habits || ['cigarette', 'puff_vape']
  );
  const [primarySubstance, setPrimarySubstance] = useState<SubstanceType>(
    profile.primarySubstance || 'cigarette'
  );

  // Daily Habits
  const [cigsPerDay, setCigsPerDay] = useState(profile.cigarettesPerDay || 15);
  const [pricePerPack, setPricePerPack] = useState(profile.pricePerPack || 12.5);
  const [puffsPerDay, setPuffsPerDay] = useState(profile.puffsPerDay || 80);
  const [podPrice, setPodPrice] = useState(profile.podPrice ?? 18);
  const [cannabisGrams, setCannabisGrams] = useState(profile.cannabisGramsPerWeek || 3.5);
  const [pricePerGram, setPricePerGram] = useState(profile.pricePerGram ?? 10);
  const [yearsSmoking, setYearsSmoking] = useState(profile.smokingHabitByDay?.yearsSmoking ?? 6);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(
    profile.smokingHabitByDay?.peakTriggers || ['Stress', 'After meal', 'Work break']
  );

  const [quitMode, setQuitMode] = useState<QuitMode>(profile.quitMode || 'cold_turkey');
  const [quitDate, setQuitDate] = useState(() =>
    profile.quitDate ? profile.quitDate.substring(0, 10) : new Date().toISOString().substring(0, 10)
  );

  const [confirmReset, setConfirmReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isFr = lang === 'fr';

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
      ? religion && religion !== 'None'
        ? `En accord avec votre quête de maîtrise (${religion}), retrouver la souveraineté sur vos impulsions réaligne votre corps et votre esprit avec vos valeurs les plus profondes.`
        : `Retrouver la souveraineté sur vos impulsions réaligne votre biologie avec votre véritable potentiel intérieur.`
      : religion && religion !== 'None'
        ? `Aligning with your values (${religion}), taking back full sovereignty over chemical impulses restores balance between your mind, body, and highest purpose.`
        : `Taking back full sovereignty over chemical impulses liberates your mind and restores your daily mental clarity.`;

    return {
      title: isFr ? `Plan de Coaching Sur-Mesure pour ${userName}` : `Custom AI Coach Blueprint for ${userName}`,
      careerImpact,
      wealthImpact,
      spiritualMindset,
    };
  }, [name, primarySubstance, job, religion, monthlyCostEstimate, incomePercent, currency, isFr]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Champion',
      avatar,
      language: lang,
      theme,
      soundEnabled,
      currency,
      age: Number(age) || 28,
      gender,
      ethnicity,
      religion,
      job,
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
      quitDate: new Date(quitDate).toISOString(),
    };

    sound.setEnabled(soundEnabled);
    sound.playClick();
    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const triggerOptions = [
    { id: 'Stress', labelEn: 'Stress & Pressure', labelFr: 'Stress & Pression' },
    { id: 'After meal', labelEn: 'After Meals', labelFr: 'Après le repas' },
    { id: 'Morning coffee', labelEn: 'Morning Coffee', labelFr: 'Café du matin' },
    { id: 'Work break', labelEn: 'Work & Screen Break', labelFr: 'Pause travail' },
    { id: 'Social drinks', labelEn: 'Social / Alcohol', labelFr: 'Soirées / Alcool' },
    { id: 'Boredom', labelEn: 'Boredom / Driving', labelFr: 'Ennui / Conduite' },
    { id: 'Evening relax', labelEn: 'Evening Wind-down', labelFr: 'Détente du soir' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-5 sm:p-7 border border-white/15 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            title={isFr ? 'Changer de photo de profil' : 'Change profile picture'}
            className="relative cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 bg-slate-900">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          <div className="min-w-0 pr-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight truncate">
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

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/10 mb-4 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'identity', label: isFr ? '1. Identité' : '1. Identity', icon: User },
            { id: 'habits', label: isFr ? '2. Habitudes' : '2. Habits', icon: Flame },
            { id: 'coach', label: isFr ? '3. Coach IA' : '3. AI Coach', icon: Brain },
            { id: 'app', label: isFr ? '4. Système' : '4. App', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveSection(tab.id as typeof activeSection);
                }}
                className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* SECTION 1: IDENTITY & LIFE CONTEXT */}
          {activeSection === 'identity' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {isFr
                    ? 'Ces informations restent 100% privées sur votre appareil. Elles permettent au moteur Obsidian Core de calibrer des conseils psychologiques et financiers adaptés à votre réalité.'
                    : 'This information stays 100% private on your device. It allows the Obsidian Core to personalize psychological and financial coaching to your exact life.'}
                </span>
              </div>

              {/* AVATAR SELECTOR & LOCAL PHOTO UPLOAD */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFr ? 'Photo de Profil & Style (6 styles)' : 'Profile Photo & Styles (6 styles)'}</span>
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

                {/* 6 Avatar Presets */}
                <div className="grid grid-cols-6 gap-2 pt-1">
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
                            : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                        }`}
                      >
                        <img src={p.url} alt={p.id} className="w-full h-full object-cover" />
                        {isSelected && (
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-500/80 py-0.5 flex items-center justify-center">
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
                  placeholder="Alex"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFr ? 'Ethnicité / Origine' : 'Ethnicity'}
                  </label>
                  <input
                    type="text"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    placeholder={isFr ? 'Ex: Européenne, Africaine, Métisse...' : 'e.g. Mixed, European, Black...'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFr ? 'Spiritualité / Religion' : 'Religion / Faith'}
                  </label>
                  <input
                    type="text"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    placeholder={isFr ? 'Ex: Spirituel, Chrétien, Musulman, Laïque...' : 'e.g. Spiritual, Christian, Muslim, Secular...'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="pt-1 border-t border-white/10">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-emerald-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isFr ? 'Situation Professionnelle & Revenus' : 'Career & Financial Profile'}</span>
                </div>

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
                        placeholder="3500"
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveSection('habits');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/10"
                >
                  <span>{isFr ? 'Passer aux Habitudes' : 'Continue to Habits'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: SUBSTANCE HABITS & DIAGNOSIS */}
          {activeSection === 'habits' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isFr ? 'Vos Substances Actuelles (sélection multiple)' : 'Your Current Substances (Multi-select)'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cigarette' as SubstanceType, labelEn: 'Cigarette', labelFr: 'Cigarette', icon: '🚬' },
                    { id: 'puff_vape' as SubstanceType, labelEn: 'Vape / Puff', labelFr: 'Puff / Vape', icon: '💨' },
                    { id: 'cannabis' as SubstanceType, labelEn: 'Cannabis / Weed', labelFr: 'Cannabis / Herbe', icon: '🌿' },
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
                      {h === 'cigarette' ? '🚬 Cigarette' : h === 'puff_vape' ? '💨 Vape' : '🌿 Cannabis'}
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
                          onChange={(e) => setCigsPerDay(Number(e.target.value))}
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
                          onChange={(e) => setPricePerPack(Number(e.target.value))}
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
                          onChange={(e) => setPuffsPerDay(Number(e.target.value))}
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
                          onChange={(e) => setPodPrice(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {habits.includes('cannabis') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
                    <span className="text-xs font-bold text-slate-200">🌿 {isFr ? 'Paramètres Cannabis / Weed' : 'Cannabis Baseline'}</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">{isFr ? 'Grames / semaine' : 'Grams / week'}</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={cannabisGrams}
                          onChange={(e) => setCannabisGrams(Number(e.target.value))}
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
                          onChange={(e) => setPricePerGram(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFr ? 'Date de Début / Arrêt' : 'Clean Start Date'}
                  </label>
                  <input
                    type="date"
                    value={quitDate}
                    onChange={(e) => setQuitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFr ? 'Années de Pratique' : 'Years Consuming'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={yearsSmoking}
                    onChange={(e) => setYearsSmoking(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveSection('coach');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/10"
                >
                  <span>{isFr ? 'Voir le Diagnostic Coach IA' : 'View AI Coach Blueprint'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: AI COACH BLUEPRINT & PERSONALIZED LIFE INTEGRATION */}
          {activeSection === 'coach' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900/90 via-emerald-950/30 to-slate-900/90 border border-emerald-500/30 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{coachAnalysis.title}</h4>
                    <span className="text-[11px] text-emerald-400 font-medium">Obsidian Life Adaptation Engine</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {isFr ? 'Impact Professionnel & Énergie' : 'Career & Cognitive Stamina'}
                    </span>
                    <p>{coachAnalysis.careerImpact}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {isFr ? 'Libération Financière & Pouvoir d\'Achat' : 'Financial Sovereignty'}
                    </span>
                    <p>{coachAnalysis.wealthImpact}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      {isFr ? 'Maîtrise de Soi & Alignement Mental' : 'Mindset & Self-Mastery'}
                    </span>
                    <p>{coachAnalysis.spiritualMindset}</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
                  <span className="font-bold">✨ {isFr ? 'Comment l\'IA vous accompagne au quotidien :' : 'How your coach adapts daily:'}</span>
                  <p className="mt-1">
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
          )}

          {/* SECTION 4: SYSTEM PREFERENCES (THEME, SOUND, RESET) */}
          {activeSection === 'app' && (
            <div className="space-y-4 animate-fade-in">
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

              {/* Reset / Onboarding re-run */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRerunOnboarding();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs text-slate-300 hover:text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isFr ? 'Revoir le Guide' : 'Rerun Tour'}</span>
                </button>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFr ? 'Réinitialiser' : 'Reset All'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                  >
                    {isFr ? 'Confirmer la Réinitialisation ?' : 'Confirm Reset?'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Primary Action Button (Always visible at bottom) */}
          <div className="pt-3 border-t border-white/10 shrink-0">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{isFr ? 'Profil et Coach Enregistrés !' : 'Profile & Coach Updated!'}</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>
                    {isFr ? 'Enregistrer & Activer le Coach Personnalisé' : 'Save & Calibrate AI Coach'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
