import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticStyle = 'light' | 'medium' | 'selection' | 'success' | 'warning';

const WEB_VIBRATION_PATTERNS: Record<HapticStyle, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 16,
  success: [12, 32, 18],
  warning: [18, 36, 18],
};

let hapticsEnabled = true;
let lastHapticAtMs = 0;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!hapticsEnabled || typeof window === 'undefined') return;

  const now = performance.now();
  if (now - lastHapticAtMs < 20) return;
  lastHapticAtMs = now;

  if (Capacitor.isNativePlatform()) {
    void triggerNativeHaptic(style);
    return;
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(WEB_VIBRATION_PATTERNS[style] ?? 10);
    }
  } catch {
    // Ignore unsupported browser vibration restrictions
  }
}

async function triggerNativeHaptic(style: HapticStyle): Promise<void> {
  try {
    switch (style) {
      case 'selection':
        await Haptics.selectionChanged();
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'light':
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
    }
  } catch {
    // Ignore platforms without haptic motor
  }
}

const VALID_STYLES = new Set<string>([
  'light',
  'medium',
  'selection',
  'success',
  'warning',
]);

export function registerGlobalButtonHaptics(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const interactive = target.closest(
      'button, [role="button"], [role="tab"], [role="switch"]',
    ) as HTMLElement | null;
    if (!interactive) return;

    if (
      (interactive as HTMLButtonElement).disabled ||
      interactive.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }

    const explicit = interactive.getAttribute('data-haptic');
    if (explicit === 'none') return;

    let style: HapticStyle = 'light';
    if (explicit && VALID_STYLES.has(explicit)) {
      style = explicit as HapticStyle;
    } else {
      const role = interactive.getAttribute('role');
      if (role === 'tab') {
        style = 'selection';
      } else if (role === 'switch') {
        style = 'medium';
      }
    }

    triggerHaptic(style);
  };

  document.addEventListener('click', handleClick, { capture: true, passive: true });
  return () => {
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
