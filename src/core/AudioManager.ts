export class AudioManager {
  private musicEnabled = true;

  toggleMusic(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  playSfx(_name: string) {
    if (!this.musicEnabled) return;
    // Hook for future SFX playback; intentionally empty while assets are placeholders.
  }
}
