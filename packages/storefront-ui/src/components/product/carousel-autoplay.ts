/** Time between automatic image changes. */
export const AUTOPLAY_INTERVAL_MS = 3000

/** After the customer touches, scrolls or clicks, autoplay stays off for this long. */
export const AUTOPLAY_RESUME_DELAY_MS = 6000

/** Next index, wrapping back to the first image after the last. */
export function nextIndex(current: number, length: number): number {
  if (length <= 0) return 0
  return (current + 1) % length
}

export interface AutoplayState {
  /** Number of images. */
  count: number
  /** Pointer is over the gallery (desktop). */
  isHovered: boolean
  /** Keyboard focus is inside the gallery. */
  hasFocus: boolean
  /** Gallery is at least partly visible in the viewport. */
  isInView: boolean
  /** Browser tab is visible. */
  isTabVisible: boolean
  /** Customer pressed the pause button. */
  isUserPaused: boolean
  prefersReducedMotion: boolean
  /** Timestamp of the last manual interaction, if any. */
  lastInteractionAt: number | null
  now: number
  resumeDelayMs?: number
}

/**
 * Whether the gallery may change image on this tick. Autoplay must never fight
 * the customer, run off-screen, or ignore reduced-motion preferences.
 */
export function shouldAutoAdvance(state: AutoplayState): boolean {
  if (state.count < 2) return false
  if (state.prefersReducedMotion) return false
  if (state.isUserPaused) return false
  if (state.isHovered || state.hasFocus) return false
  if (!state.isInView || !state.isTabVisible) return false

  if (state.lastInteractionAt !== null) {
    const resumeDelay = state.resumeDelayMs ?? AUTOPLAY_RESUME_DELAY_MS
    if (state.now - state.lastInteractionAt < resumeDelay) return false
  }

  return true
}
