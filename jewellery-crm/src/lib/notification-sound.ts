/**
 * Notification Sound Utility
 * 
 * Handles playing notification sounds when new notifications arrive
 */

class NotificationSound {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Only initialize audio in browser environment
    if (typeof window !== 'undefined') {
      this.initializeAudio();
    }
  }

  private initializeAudio() {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return;
      }

      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a simple "ding" sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Store the audio context for reuse
      this.audio = new HTMLAudioElement();
    } catch (error) {
      console.warn('Could not initialize notification sound:', error);
    }
  }

  /**
   * Play notification sound
   */
  play() {
    if (!this.isEnabled || !this.audio || typeof window === 'undefined') return;

    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Enable/disable notification sounds
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.isEnabled;
  }
}

// Create a lazy singleton instance
let notificationSoundInstance: NotificationSound | null = null;

export const notificationSound = {
  get instance() {
    if (!notificationSoundInstance && typeof window !== 'undefined') {
      notificationSoundInstance = new NotificationSound();
    }
    return notificationSoundInstance;
  },
  
  play() {
    this.instance?.play();
  },
  
  setEnabled(enabled: boolean) {
    this.instance?.setEnabled(enabled);
  },
  
  setVolume(volume: number) {
    this.instance?.setVolume(volume);
  },
  
  getVolume(): number {
    return this.instance?.getVolume() || 0.5;
  },
  
  isSoundEnabled(): boolean {
    return this.instance?.isSoundEnabled() || false;
  }
}; 