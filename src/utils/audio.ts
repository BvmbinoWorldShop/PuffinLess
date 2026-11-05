// Lightweight Web Audio API generator for subtle luxury haptic sounds & breathing cues
// with full Web Haptics (navigator.vibrate) tactile feedback for mobile and desktop

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastClickTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
    if (typeof window !== 'undefined') {
      this.attachGlobalInteractions();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Native Web Haptic Vibration (Tactile return for mobile and desktop)
  public vibrate(pattern: number | number[] = 45) {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe catch on restricted environments
      }
    }
  }

  // Pre-configured tactile feedback patterns (High-strength tactile impulse)
  public hapticTick() {
    this.vibrate(45); // strong, crisp 45ms mechanical punch
  }

  public hapticSelect() {
    this.vibrate(60); // solid 60ms selection thud
  }

  public hapticToggle() {
    this.vibrate([40, 30, 50]); // firm dual-kick for switches and toggles
  }

  public hapticSuccess() {
    this.vibrate([60, 40, 90, 40, 130]); // deep celebratory motor rumble
  }

  public hapticWarning() {
    this.vibrate([80, 50, 90]); // strong urgent alert pulse
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft subtle click for glass buttons & inputs
  public playClick(force: boolean = false) {
    const now = Date.now();
    // Debounce to prevent acoustic overlap when global delegation and onClick both fire
    if (!force && now - this.lastClickTime < 50) return;
    this.lastClickTime = now;

    // Trigger haptic vibration
    this.hapticTick();

    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // AudioContext could fail gracefully if restricted
    }
  }

  // Distinct warning/slip tone when logging an intake
  public playWarning() {
    this.hapticWarning();
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // AudioContext safe catch
    }
  }

  // Meditative bowl chime for breathing exercise inhale/exhale
  public playBreathTone(isExhale: boolean = false) {
    this.vibrate(20);
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isExhale ? 261.63 : 329.63; // C4 or E4 tone
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.2);
    } catch {
      // Audio context catch
    }
  }

  // Rewarding celebration chime when resisting a crave, reaching milestones or badges
  public playCelebration() {
    this.hapticSuccess();
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.12, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.55);
      });
    } catch {
      // Audio context catch
    }
  }

  // Global listener ensuring ANY interactive button, toggle & input triggers tactile haptics & audio
  private attachGlobalInteractions() {
    if (typeof window === 'undefined') return;

    // Instant tactile vibration on finger touch / pointerdown (zero latency tactile return)
    window.addEventListener(
      'pointerdown',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const interactive = target.closest(
          'button, [role="button"], [role="tab"], [role="switch"], a, input[type="checkbox"], input[type="radio"], select, .glass-button'
        );
        if (interactive) {
          if (interactive.matches('input[type="checkbox"], input[type="radio"], [role="switch"]')) {
            this.hapticToggle();
          } else if (interactive.matches('[role="tab"]')) {
            this.hapticSelect();
          } else {
            this.hapticTick();
          }
        }
      },
      { capture: true, passive: true }
    );

    // Listen to button clicks, toggles, selectors for audio synthesis
    window.addEventListener(
      'click',
      (e) => {
        if (!this.enabled) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const interactive = target.closest(
          'button, [role="button"], [role="tab"], [role="switch"], a, input[type="checkbox"], input[type="radio"], input[type="range"], select'
        );
        if (interactive) {
          this.playClick();
        }
      },
      { capture: true, passive: true }
    );

    // Listen to form input changes (typing, slider drags)
    window.addEventListener(
      'input',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const isInputField = target.matches('input, textarea, select');
        if (isInputField) {
          this.hapticTick();
          if (this.enabled) {
            this.playClick();
          }
        }
      },
      { capture: true, passive: true }
    );
  }
}

export const sound = new SoundManager();
