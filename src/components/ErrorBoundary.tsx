import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Shield, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { recoverAllDeviceData } from '../utils/recovery';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
  recoverySuccess: string | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      recoverySuccess: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[PuffinLess ErrorBoundary] Uncaught React rendering exception:', error, errorInfo);
  }

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleDeepRecovery = async (): Promise<void> => {
    this.setState({ isRecovering: true, recoverySuccess: null });
    try {
      const res = await recoverAllDeviceData();
      if (res && res.recovered) {
        const msg = `✓ ${res.stats.daysSinceQuit} jour(s) et ${res.stats.cravingsCount} victoires restaurés avec succès. Rechargement...`;
        this.setState({ recoverySuccess: msg });
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 1200);
      } else {
        this.setState({
          recoverySuccess: 'Aucune donnée antérieure compromise. Vos sauvegardes locales restent intactes.',
          isRecovering: false,
        });
      }
    } catch (err) {
      console.error('[ErrorBoundary] Deep recovery failed:', err);
      this.setState({
        recoverySuccess: 'Tentative de réparation effectuée. Rechargement recommandé.',
        isRecovering: false,
      });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isFr =
        typeof localStorage !== 'undefined'
          ? (localStorage.getItem('puffinless_app_lang') || localStorage.getItem('puffinless_lang')) !== 'en'
          : true;

      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30">
          <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl relative overflow-hidden flex flex-col items-center text-center">
            {/* Background ambient glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Shield Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-5 text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              {isFr ? 'Une interruption est survenue' : 'An interruption occurred'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mb-6">
              {isFr
                ? 'L\'affichage a été suspendu pour préserver la sécurité de vos données. Vos jours d\'abstinence et votre historique restent intacts sur cet appareil.'
                : 'Rendering was paused to protect your data security. Your streak days and history remain intact on this device.'}
            </p>

            {this.state.recoverySuccess && (
              <div className="w-full mb-5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-fade-in text-left">
                {this.state.recoverySuccess}
              </div>
            )}

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isFr ? 'Recharger l\'application' : 'Reload Application'}</span>
              </button>

              <button
                type="button"
                disabled={this.state.isRecovering}
                onClick={this.handleDeepRecovery}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-white font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Shield className={`w-3.5 h-3.5 text-emerald-400 ${this.state.isRecovering ? 'animate-pulse' : ''}`} />
                <span>
                  {this.state.isRecovering
                    ? isFr
                      ? 'Récupération en cours...'
                      : 'Recovering...'
                    : isFr
                    ? 'Mode Récupération & Réparation'
                    : 'Deep Recovery & Repair'}
                </span>
              </button>
            </div>

            {/* Diagnostic Details Toggle */}
            <div className="w-full mt-6 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400/80" />
                <span>{isFr ? 'Informations de diagnostic' : 'Diagnostic details'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 text-left font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto break-all">
                  <div className="text-amber-300 font-bold mb-1">
                    {this.state.error?.name}: {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <div className="text-slate-400 opacity-80 whitespace-pre-wrap">{this.state.error.stack}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
