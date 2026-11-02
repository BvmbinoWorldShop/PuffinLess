import React, { useState } from 'react';
import {
  Coins,
  Plus,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Moon,
  Target,
  Sparkles,
  X,
  Trash2,
  Cigarette,
  Wind,
  Leaf,
  Flame,
  CheckCircle,
} from 'lucide-react';
import type { UserProfile, SavingsGoal, PurchaseExpense, ExpenseItemType } from '../types';
import type { CalculatedStats } from '../utils/calculations';
import { computeHarmAndWealthMetrics } from '../utils/substanceScience';
import { MorphicCard } from './MorphicCard';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface MoneyViewProps {
  profile: UserProfile;
  stats: CalculatedStats;
  goals: SavingsGoal[];
  expenses: PurchaseExpense[];
  onAddExpense: (expense: PurchaseExpense) => void;
  onDeleteExpense: (id: string) => void;
  onAddGoal: (goal: SavingsGoal) => void;
  onToggleGoalComplete: (id: string) => void;
}

export const MoneyView: React.FC<MoneyViewProps> = ({
  profile,
  stats,
  goals,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onAddGoal,
  onToggleGoalComplete,
}) => {
  const isFr = profile.language === 'fr';
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'goals'>('overview');

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [itemType, setItemType] = useState<ExpenseItemType>('cigarettes');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expensePrice, setExpensePrice] = useState('');
  const [expenseQuantity, setExpenseQuantity] = useState('1');
  const [expenseNote, setExpenseNote] = useState('');

  // Goal modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<SavingsGoal['category']>('tech');

  // Compute expenses total
  const totalMoneySpent = expenses.reduce((acc, exp) => acc + (exp.price * exp.quantity), 0);

  // Compute total cigarettes, puffs, cannabis consumed for study calculations
  const totalCigsEstimated = stats.cigarettesSmokedSlips + (expenses.filter(e => e.itemType === 'cigarettes').reduce((acc, e) => acc + e.quantity * 20, 0));
  const totalPuffsEstimated = expenses.filter(e => e.itemType === 'puff_vape').reduce((acc, e) => acc + e.quantity * 600, 0);
  const totalCannabisEstimated = expenses.filter(e => e.itemType === 'cannabis').reduce((acc, e) => acc + e.quantity * 3, 0);

  // Clinical harm & financial damage report
  const harmReport = computeHarmAndWealthMetrics(
    totalMoneySpent,
    totalCigsEstimated,
    totalPuffsEstimated,
    totalCannabisEstimated
  );

  const dailyCost = stats.dailyBaselineCost;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expensePrice) return;

    const newExpense: PurchaseExpense = {
      id: 'exp-' + Date.now(),
      itemType,
      title: expenseTitle.trim(),
      price: Number(expensePrice),
      quantity: Number(expenseQuantity) || 1,
      timestamp: new Date().toISOString(),
      note: expenseNote.trim(),
    };

    onAddExpense(newExpense);
    sound.playClick();
    setExpenseTitle('');
    setExpensePrice('');
    setExpenseQuantity('1');
    setExpenseNote('');
    setIsExpenseModalOpen(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    const goal: SavingsGoal = {
      id: 'goal-' + Date.now(),
      title: newTitle.trim(),
      targetAmount: Number(newAmount),
      category: newCategory,
      icon: newCategory === 'travel' ? 'Plane' : newCategory === 'tech' ? 'Smartphone' : 'Gift',
      completed: false,
    };

    onAddGoal(goal);
    sound.playCelebration();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Confetti fallback
    }

    setNewTitle('');
    setNewAmount('');
    setIsGoalModalOpen(false);
  };

  const getItemTypeBadge = (type: ExpenseItemType) => {
    switch (type) {
      case 'cigarettes':
        return { label: isFr ? 'Cigarettes' : 'Cigarettes', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Cigarette };
      case 'puff_vape':
        return { label: isFr ? 'Puff / Vape' : 'Puff / Vape', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: Wind };
      case 'cannabis':
        return { label: isFr ? 'Herbe / Cannabis' : 'Weed / Cannabis', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30', icon: Leaf };
      case 'rolling_papers':
        return { label: isFr ? 'Feuilles & Filtres' : 'Rolling Papers & Tips', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: Flame };
      case 'lighters':
        return { label: isFr ? 'Briquets' : 'Lighters', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: Flame };
      default:
        return { label: isFr ? 'Accessoires & Matériel' : 'Gear & Accessories', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Coins };
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 1. Header Vault with Money Preserved vs Money Spent */}
      <MorphicCard variant="gold" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {isFr ? 'Centre Financier PuffinLess' : 'PuffinLess Money Center'}
              </span>
              <p className="text-[11px] text-amber-200/80">
                {isFr ? 'Suivi précis des dépenses, du capital préservé et des intérêts composés' : 'Track spending, compounded loss & preserved capital'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 hover:bg-amber-500/35 text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isFr ? 'Noter un Achat' : 'Add Purchase'}</span>
          </button>
        </div>

        {/* 2 Big Totals Comparison */}
        <div className="grid grid-cols-2 gap-3 py-2 text-center">
          <div className="p-3.5 rounded-2xl glass-panel border border-emerald-500/30">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {isFr ? 'Économisé & Préservé' : 'Preserved / Saved'}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-200 mt-1">
              {profile.currency}{stats.moneySaved.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-300/70 mt-1">
              {isFr ? 'Resté dans votre poche' : 'Kept in your pocket'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel border border-rose-500/30">
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {isFr ? 'Achats Enregistrés' : 'Logged Purchases'}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-200 mt-1">
              {profile.currency}{totalMoneySpent.toLocaleString()}
            </div>
            <p className="text-[10px] text-rose-300/70 mt-1">
              {isFr ? `${expenses.length} achats enregistrés` : `${expenses.length} purchases recorded`}
            </p>
          </div>
        </div>
      </MorphicCard>

      {/* 2. Sub-Tabs: Overview & Harm Report | Purchases History | Wishlist Goals */}
      <div className="flex rounded-2xl p-1 bg-slate-900/60 border border-white/10">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('overview');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isFr ? 'Impact Santé & Fortune' : 'Health & Wealth Impact'}
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('expenses');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'expenses'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isFr ? `Achats (${expenses.length})` : `Purchases (${expenses.length})`}
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('goals');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'goals'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isFr ? 'Projets d\'Épargne' : 'Wishlist Goals'}
        </button>
      </div>

      {/* TAB 1: Scientific Damage & Compounded Wealth Report */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <MorphicCard variant="elevated" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {isFr ? 'Calculateur d\'Impact Clinique & Financier' : 'Clinical Habit Cost Calculator'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">BMJ & CDC Medical Benchmarks</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isFr
                ? 'Chaque achat de tabac, de vape, d\'herbe ou d\'accessoires prélève un double tribut : l\'érosion de votre capital et l\'usure biologique accélérée de vos organes.'
                : 'Every purchase of cigarettes, vape pods, weed, or rolling gear extracts a dual toll: instant wealth erosion plus biological depreciation.'}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 10-Year Opportunity Cost */}
              <div className="p-3 rounded-2xl glass-panel border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {isFr ? 'Perte Investie sur 10 Ans' : '10-Yr Invested Loss'}
                </span>
                <div className="text-xl font-extrabold text-amber-200">
                  {profile.currency}{harmReport.opportunityCost10Years.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isFr
                    ? 'Valeur si cette somme était investie en ETF monde à 7% d\'intérêts composés annuels.'
                    : 'Value if invested in S&P 500 at 7% compound annual return instead of smoke.'}
                </p>
              </div>

              {/* Life Lost Hours */}
              <div className="p-3 rounded-2xl glass-panel border border-rose-500/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isFr ? 'Espérance de Vie Perdue' : 'Life Lost to Toxins'}
                </span>
                <div className="text-xl font-extrabold text-rose-200">
                  {harmReport.estimatedLifeLostHours} <span className="text-xs font-normal">{isFr ? 'heures' : 'hrs'}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isFr
                    ? 'Selon le British Medical Journal : 11 min par cigarette / joint consumé.'
                    : 'Based on British Medical Journal: 11 mins per cigarette / joint combustion.'}
                </p>
              </div>

              {/* Sleep Architecture Disruption */}
              <div className="p-3 rounded-2xl glass-panel border border-purple-500/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  {isFr ? 'Chute du Sommeil Paradoxal' : 'REM Sleep Penalty'}
                </span>
                <div className="text-xl font-extrabold text-purple-200">
                  -{harmReport.sleepEfficiencyLossPercent}%
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isFr
                    ? 'La nicotine et le THC suppriment les phases profondes de régénération cérébrale.'
                    : 'Nicotine & THC suppress Stage 4 restorative dreaming sleep.'}
                </p>
              </div>

              {/* Toxic Particulate Index */}
              <div className="p-3 rounded-2xl glass-panel border border-cyan-500/30 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Wind className="w-3 h-3" />
                  {isFr ? 'Charge Toxique Pulmonaire' : 'Lung Particle Load'}
                </span>
                <div className="text-xl font-extrabold text-cyan-200">
                  {harmReport.toxicLoadIndex} <span className="text-xs font-normal">/ 100</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isFr
                    ? 'Dépôts alvéolaires estimés de goudrons, d\'acroléine et de métaux lourds chauffés.'
                    : 'Estimated alveolar sediment from tar, acrolein, and heated aerosols.'}
                </p>
              </div>
            </div>
          </MorphicCard>

          {/* Compound Wealth Forecasts */}
          <MorphicCard variant="default">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {isFr ? 'Horizons d\'Épargne & Projections' : 'Projected Freedom Horizons'}
              </h4>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {isFr ? 'Capitalisation d\'une Vie Propre' : 'Clean Living Compounding'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { period: isFr ? '1 Mois' : '1 Month', amount: (dailyCost * 30.4).toFixed(0), label: isFr ? 'Restaurants / Vêtements' : 'Fine dining / shoes' },
                { period: isFr ? '1 An' : '1 Year', amount: (dailyCost * 365).toFixed(0), label: isFr ? 'Voyage international' : 'International trip' },
                { period: isFr ? '5 Ans' : '5 Years', amount: (dailyCost * 365 * 5).toFixed(0), label: isFr ? 'Apport pour un bien / Voiture' : 'Car down-payment' },
              ].map((h) => (
                <div key={h.period} className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400">{h.period}</span>
                  <div className="text-sm font-extrabold text-emerald-300">
                    {profile.currency}{Number(h.amount).toLocaleString()}
                  </div>
                  <span className="text-[9px] text-slate-400 block truncate">{h.label}</span>
                </div>
              ))}
            </div>
          </MorphicCard>
        </div>
      )}

      {/* TAB 2: Purchase Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {isFr ? 'Historique des Dépenses (Tabac, Vape, Herbe, Feuilles)' : 'Expense Log (Cigs, Weed, Vapes, Papers)'}
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs text-amber-400 hover:underline font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFr ? 'Ajouter' : 'Add Item'}</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {isFr ? 'Aucun achat enregistré. Bravo pour avoir gardé votre argent intact !' : 'No purchases recorded. Click "Add Purchase" above to track your spending.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {expenses.map((exp) => {
                const badge = getItemTypeBadge(exp.itemType);
                const BadgeIcon = badge.icon;
                const totalItemCost = exp.price * exp.quantity;

                return (
                  <MorphicCard key={exp.id} variant="default" className="border-white/10 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${badge.color}`}>
                          <BadgeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{exp.title}</h4>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {exp.quantity}x @ {profile.currency}{exp.price.toFixed(2)} • {new Date(exp.timestamp).toLocaleDateString()}
                          </p>
                          {exp.note && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">{exp.note}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-rose-300">
                          -{profile.currency}{totalItemCost.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            sound.playClick();
                            onDeleteExpense(exp.id);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </MorphicCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Dream Wishlist Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isFr ? 'Objectifs d\'Épargne & Projets' : 'Dream Wishlist Goals'}
              </h3>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setIsGoalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFr ? 'Nouveau Projet' : 'New Goal'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {goals.map((g) => {
              const progress = Math.min(100, Math.round((stats.moneySaved / g.targetAmount) * 100));
              const isFunded = stats.moneySaved >= g.targetAmount;
              const remainingAmount = Math.max(0, g.targetAmount - stats.moneySaved);
              const daysRemaining = Math.ceil(remainingAmount / Math.max(1, dailyCost));

              return (
                <MorphicCard
                  key={g.id}
                  variant={g.completed ? 'default' : isFunded ? 'gold' : 'elevated'}
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{g.title}</span>
                        {g.completed && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            {isFr ? 'RÉALISÉ' : 'COMPLETED'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isFr ? 'Objectif :' : 'Goal:'} <b className="text-white">{profile.currency}{g.targetAmount}</b>
                      </p>
                    </div>

                    <span className="text-sm font-extrabold text-amber-300">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-900/80 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isFunded
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {isFunded ? (
                        <span className="text-amber-300 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {isFr ? 'Financé avec vos économies !' : 'Ready to buy with saved cash!'}
                        </span>
                      ) : (
                        isFr
                          ? `${daysRemaining} jours de souffle pur restants`
                          : `${daysRemaining} days of clean breathing left`
                      )}
                    </span>

                    <button
                      onClick={() => {
                        sound.playClick();
                        onToggleGoalComplete(g.id);
                      }}
                      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                        g.completed
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                          : 'glass-button text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>{g.completed ? (isFr ? 'Acheté ✓' : 'Claimed') : (isFr ? 'Valider l\'achat' : 'Mark Claimed')}</span>
                    </button>
                  </div>
                </MorphicCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Expense Purchase Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-6 border border-white/15 shadow-2xl">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {isFr ? 'Enregistrer une Dépense Tabac / Vape' : 'Log Smoking Purchase'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isFr
                ? 'Mesurez précisément le cash englouti dans les paquets, puffs, herbe et accessoires.'
                : 'Track how much cash is going into cigarettes, weed, vapes, papers, and lighters.'}
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isFr ? 'Catégorie d\'article' : 'Item Category'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'cigarettes', label: isFr ? 'Cigarettes' : 'Cigarettes' },
                      { id: 'puff_vape', label: isFr ? 'Puff / Vape' : 'Puff / Vape' },
                      { id: 'cannabis', label: isFr ? 'Herbe / Weed' : 'Weed / Herb' },
                      { id: 'rolling_papers', label: isFr ? 'Feuilles / Tips' : 'Rolling Papers' },
                      { id: 'lighters', label: isFr ? 'Briquets' : 'Lighters' },
                      { id: 'accessories', label: isFr ? 'Accessoires' : 'Accessories' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setItemType(cat.id)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        itemType === cat.id
                          ? 'bg-amber-500/25 border-amber-400/50 text-amber-200'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isFr ? 'Description de l\'article' : 'Item Description'}
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder={isFr ? 'ex: Paquet Marlboro, Elfbar 600, Feuilles RAW' : 'e.g. Camel Blue Pack, RAW Papers, Vape Pod'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isFr ? 'Prix unitaire' : 'Price'} ({profile.currency})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={expensePrice}
                    onChange={(e) => setExpensePrice(e.target.value)}
                    placeholder="12.50"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isFr ? 'Quantité' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseQuantity}
                    onChange={(e) => setExpenseQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isFr ? 'Note (optionnelle)' : 'Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder={isFr ? 'Acheté en soirée, coup de stress...' : 'Bought at station, feeling stressed...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all"
                >
                  {isFr ? 'Enregistrer cet Achat' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-6 border border-white/15 shadow-2xl">
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {isFr ? 'Créer un Projet d\'Épargne' : 'Create Wishlist Goal'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isFr
                ? 'Récompensez-vous avec un cadeau qui vous passionne grâce à l\'argent sauvé.'
                : 'Reward yourself with something you love using your unburned money.'}
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isFr ? 'Nom du projet' : 'Goal Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isFr ? 'ex: Casque Sony WH-1000XM5, Week-end à Rome' : 'e.g. Sony WH-1000XM5 Headphones'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isFr ? 'Montant cible' : 'Target Cost'} ({profile.currency})
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="399"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isFr ? 'Catégorie' : 'Category'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tech', 'travel', 'luxury', 'wellness', 'family'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`p-2 rounded-xl text-xs font-medium capitalize border text-center transition-all ${
                        newCategory === cat
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'tech' ? (isFr ? 'Tech' : 'Tech') :
                       cat === 'travel' ? (isFr ? 'Voyage' : 'Travel') :
                       cat === 'luxury' ? (isFr ? 'Luxe' : 'Luxury') :
                       cat === 'wellness' ? (isFr ? 'Bien-être' : 'Wellness') :
                       (isFr ? 'Famille' : 'Family')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all"
                >
                  {isFr ? 'Enregistrer le Projet' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
