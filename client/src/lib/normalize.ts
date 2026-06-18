import type { Landmark } from '../types'

/**
 * Convert 21 MediaPipe hand landmarks into the 63-float feature vector
 * the trained MLP expects.
 *
 * IMPORTANT: this must match the training notebook's `extract_features`:
 *   [coord for lm in landmarks for coord in (lm.x, lm.y, lm.z)]
 * MediaPipe already returns x/y/z normalized to [0, 1], exactly as the
 * model was trained on. Do NOT subtract the wrist here.
 */
export function normalize(landmarks: Landmark[]): number[] {
  if (landmarks.length !== 21) {
    throw new Error(`Expected 21 landmarks, got ${landmarks.length}`)
  }

  const features = new Array<number>(63)
  for (let i = 0; i < 21; i++) {
    const j = i * 3
    features[j] = landmarks[i].x
    features[j + 1] = landmarks[i].y
    features[j + 2] = landmarks[i].z
  }
  return features
}