/**
 * ASL alphabet reference data for the Learn tab.
 *
 * Each letter has its own public-domain hand-reference SVG vendored under
 * `client/public/learn/letters/<letter>.svg` (from Wikimedia Commons
 * "Sign language <X>.svg" by wpclipart.com — see ../../public/learn/ATTRIBUTION.txt).
 *
 * `tip` is a short, factual hand-shape description (not copyrightable).
 */

export interface LearnLetter {
  letter: string
  tip: string
}

/** Per-letter hand-shape tips. Order is A–Z. */
const TIPS: Record<string, string> = {
  A: 'Fist with thumb resting alongside the index finger.',
  B: 'Flat palm up, four fingers straight, thumb folded across the palm.',
  C: 'Hand curves into a "C" shape, fingers and thumb apart.',
  D: 'Index finger up, other fingers touch the thumbtip in a circle.',
  E: 'Fingers curled down into the palm, thumb alongside the index.',
  F: 'Thumb and index touch (OK circle); other three fingers up.',
  G: 'Index finger points sideways, thumb runs beneath it.',
  H: 'Index and middle finger point sideways, thumb tucked under.',
  I: 'Pinky finger up, other fingers curled into the palm.',
  J: 'Pinky up, then trace a "J" hook through the air.',
  K: 'Index up, middle out to the side, thumb between them.',
  L: 'Index up, thumb out — an "L" shape.',
  M: 'Three fingers (index, middle, ring) drape over the thumb.',
  N: 'Two fingers (index, middle) drape over the thumb.',
  O: 'Fingertips and thumbtip all meet to form a small circle.',
  P: '"K" shape, but hand rotated so fingers point down.',
  Q: '"G" shape, but hand rotated so fingers point down.',
  R: 'Index and middle fingers crossed, others curled in.',
  S: 'Fist with thumb folded across the front of the fingers.',
  T: 'Thumb between index and middle finger of a closed fist.',
  U: 'Index and middle fingers up together, touching.',
  V: 'Index and middle fingers up and apart — a peace sign.',
  W: 'Index, middle, and ring fingers up and apart.',
  X: 'Index finger crooked into a hook, others closed.',
  Y: 'Thumb and pinky out, other fingers curled in.',
  Z: 'Index finger draws a "Z" in the air.',
}

export const LEARN_LETTERS: LearnLetter[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map(letter => ({ letter, tip: TIPS[letter] ?? '' }))

/** Minimum live-prediction confidence (0–1) that counts as a correct sign in
 *  Practice mode. Lower than the sentence-builder's STABILITY_MIN_CONFIDENCE on
 *  purpose — practice is forgiving; sentence writing is deliberate. */
export const PRACTICE_MIN_CONFIDENCE = 0.6