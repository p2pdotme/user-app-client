import { useCallback, useMemo } from "react";
import ASSETS from "@/assets";
import { useSettings } from "@/contexts/settings";

/**
 * Sound support information
 */
interface SoundSupportInfo {
  /** Whether Web Audio API is available */
  isAPIAvailable: boolean;
  /** Human-readable reasons for support status */
  reasons: string[];
  /** Whether user has disabled sounds */
  isDisabledByUser: boolean;
  /** Whether sounds will actually play */
  willTrigger: boolean;
}

/**
 * Sound functions for business events
 */
interface SoundFunctions {
  /** QR scan success feedback */
  triggerQrScanSound: () => void;
  /** Success feedback for orders and transactions */
  triggerSuccessSound: () => void;
  /** Failure feedback for orders and transactions */
  triggerFailureSound: () => void;
}

/**
 * Check if Web Audio API is available
 */
function isWebAudioAPIAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext) !== undefined
  );
}

/**
 * Get reasons why sounds might not be supported
 */
function getSoundUnsupportedReasons(): string[] {
  const reasons: string[] = [];

  if (typeof window === "undefined") {
    reasons.push("Running in server environment");
  } else if (!isWebAudioAPIAvailable()) {
    reasons.push("Web Audio API not available");
  }

  return reasons;
}

/**
 * Play an audio file
 */
function playAudioFile(audioPath: string, volume: number = 0.6): void {
  if (typeof window === "undefined" || !isWebAudioAPIAvailable()) {
    return;
  }

  try {
    const audio = new Audio(audioPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch((error) => {
      console.warn("[useSounds] Failed to play audio:", error);
    });
  } catch (error) {
    console.warn("[useSounds] Error creating audio:", error);
  }
}

/**
 * Create sound support information
 */
function createSoundSupportInfo(soundsEnabled: boolean): SoundSupportInfo {
  const isAPIAvailable = isWebAudioAPIAvailable();
  const reasons = getSoundUnsupportedReasons();
  const isDisabledByUser = !soundsEnabled;
  const willTrigger = isAPIAvailable && soundsEnabled;

  if (isDisabledByUser) {
    reasons.push("Disabled by user preferences");
  }

  return {
    isAPIAvailable,
    reasons,
    isDisabledByUser,
    willTrigger,
  };
}

/**
 * Hook for playing sounds in response to business events
 *
 * Uses three audio files:
 * - QR_SCANNED: For successful QR code scans
 * - SUCCESS: For all successful operations (orders, transactions)
 * - FAILED: For all failed operations (orders, transactions)
 */
export function useSounds(): SoundFunctions & {
  supportInfo: SoundSupportInfo;
} {
  const { settings } = useSettings();
  const soundsEnabled = settings.sounds;

  const supportInfo = useMemo(
    () => createSoundSupportInfo(soundsEnabled),
    [soundsEnabled],
  );

  const triggerQrScanSound = useCallback(() => {
    if (supportInfo.willTrigger) {
      playAudioFile(ASSETS.AUDIO.QR_SCANNED, 0.6);
    }
  }, [supportInfo.willTrigger]);

  const triggerSuccessSound = useCallback(() => {
    if (supportInfo.willTrigger) {
      playAudioFile(ASSETS.AUDIO.SUCCESS, 0.7);
    }
  }, [supportInfo.willTrigger]);

  const triggerFailureSound = useCallback(() => {
    if (supportInfo.willTrigger) {
      playAudioFile(ASSETS.AUDIO.FAILED, 0.5);
    }
  }, [supportInfo.willTrigger]);

  return {
    triggerQrScanSound,
    triggerSuccessSound,
    triggerFailureSound,
    supportInfo,
  };
}

/**
 * Get all available sound pattern names for testing/debugging
 */
export function getAllSoundPatternNames(): readonly string[] {
  return ["qrScan", "success", "failure"] as const;
}

/**
 * Export types for external use
 */
export type { SoundFunctions, SoundSupportInfo };
