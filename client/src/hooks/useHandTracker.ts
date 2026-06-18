import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver, type ImageSource } from '@mediapipe/tasks-vision'
import type { Landmark } from '../types'

/**
 * MediaPipe assets are vendored under /public/mediapipe so the hand tracker
 * works with no runtime CDN dependency (important for offline / insecure
 * origins / flaky networks).
 *
 *   /mediapipe/wasm/vision_wasm_internal.{js,wasm}  → @mediapipe/tasks-vision@0.10.18 wasm
 *   /mediapipe/hand_landmarker.task                 → MediaPipe hand_landmarker float16 v1
 *
 * Keep these files in sync with the @mediapipe/tasks-vision version in package.json.
 */
// Resolve under the configured Vite base (import.meta.env.BASE_URL) so the
// paths work both at dev (/) and on GitHub Pages project sites (/dactylology/).
const BASE = import.meta.env.BASE_URL
const WASM_PATH = `${BASE}mediapipe/wasm`
const MODEL_PATH = `${BASE}mediapipe/hand_landmarker.task`

export function useHandTracker() {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH },
          runningMode: 'VIDEO',
          numHands: 1,
        })
        if (!active) {
          hl.close()
          return
        }
        handLandmarkerRef.current = hl
        setReady(true)
      } catch (e) {
        if (!active) return
        const msg = e instanceof Error ? e.message : String(e)
        setError(`Failed to initialize hand tracker: ${msg}`)
      }
    }

    init()

    return () => {
      active = false
      handLandmarkerRef.current?.close()
      handLandmarkerRef.current = null
    }
  }, [])

  /**
   * Run hand landmark detection on any MediaPipe ImageSource.
   * Works for live <video> frames and for <img> / <canvas> (image upload).
   * `detectForVideo` requires a strictly-increasing timestamp; we feed
   * `performance.now()` which is monotonic across both call sites.
   */
  function detect(source: ImageSource): Landmark[] | null {
    const hl = handLandmarkerRef.current
    if (!hl) return null
    const result = hl.detectForVideo(source, performance.now())
    if (!result.landmarks || result.landmarks.length === 0) return null
    return result.landmarks[0].map(l => ({ x: l.x, y: l.y, z: l.z ?? 0 }))
  }

  return { detect, ready, error }
}