import { useEffect, useRef, useState } from 'react'
import { useCamera } from './useCamera'
import { useHandTracker } from './useHandTracker'
import { useClassifier } from './useClassifier'
import { useStability } from './useStability'
import type { Landmark, Prediction } from '../types'

/** Hold the "del" gesture this long (ms) to wipe the whole sentence. */
const HOLD_DELETE_CLEAR_MS = 3000

export interface Commit {
  letter: string
}

export interface LiveRecognition {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  cameraStatus: ReturnType<typeof useCamera>['status']
  cameraError: string | null
  handTrackerReady: boolean
  handTrackerError: string | null
  modelStatus: ReturnType<typeof useClassifier>['status']
  /** Hand-landmark detector; usable for image mode too. */
  detect: ReturnType<typeof useHandTracker>['detect']
  /** MLP classifier; usable for image mode too. */
  predict: ReturnType<typeof useClassifier>['predict']
  landmarks: Landmark[] | null
  prediction: Prediction | null
  handDetected: boolean
  fps: number
}

interface UseLiveRecognitionOptions {
  /** When false, the loop is suspended (no camera, no rAF). */
  active: boolean
  /** Called with each stabilized commit, in commit order. */
  onCommit?: (letter: string) => void
  /** Called once when a sustained "del" gesture clears the whole sentence. */
  onHoldClear?: () => void
}

/**
 * Single source of truth for the live webcam recognition pipeline:
 *   webcam -> MediaPipe landmarks -> normalize -> TF.js MLP -> stability buffer
 *                                                              -> commit
 *
 * Owns useCamera, useHandTracker, useClassifier, and useStability, wires the
 * rAF loop, and reports live state (landmarks, prediction, fps…) plus commits
 * via callbacks. Both the main Camera mode (sentence builder) and the Learn
 * practice mode consume this hook.
 */
export function useLiveRecognition({
  active,
  onCommit,
  onHoldClear,
}: UseLiveRecognitionOptions): LiveRecognition {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { stream, status: cameraStatus, error: cameraError } = useCamera(active)
  const { detect, ready: handTrackerReady, error: handTrackerError } = useHandTracker()
  const { predict, status: modelStatus } = useClassifier()
  const stability = useStability()

  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [handDetected, setHandDetected] = useState(false)
  const [fps, setFps] = useState(0)

  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })

  // Latest callbacks kept in refs so the rAF loop doesn't resubscribe on
  // every render of the parent.
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit
  const onHoldClearRef = useRef(onHoldClear)
  onHoldClearRef.current = onHoldClear

  // Hold-to-clear: a sustained "del" wipes everything after HOLD_DELETE_CLEAR_MS.
  const delHoldStartRef = useRef<number | null>(null)
  const delWipedRef = useRef(false)

  useEffect(() => {
    if (!active) return
    if (cameraStatus !== 'ready') return
    if (!handTrackerReady) return
    if (modelStatus === 'not-found' || modelStatus === 'error') return

    let rafId: number

    function frame() {
      const video = videoRef.current
      if (!video || video.readyState < 2) {
        rafId = requestAnimationFrame(frame)
        return
      }

      const lms: Landmark[] | null = detect(video)
      const detected = lms !== null
      setHandDetected(detected)
      setLandmarks(lms)

      let framePred: Prediction | null = null
      if (detected) {
        const pred = predict(lms)
        if (pred) {
          framePred = pred
          setPrediction(pred)
          stability.push(pred)
        } else {
          setPrediction(null)
          stability.push(null)
        }
      } else {
        setPrediction(null)
        stability.push(null)
      }

      const committed = stability.consume()
      if (committed) onCommitRef.current?.(committed)

      const now = performance.now()
      const fpsData = fpsRef.current
      fpsData.frames++
      if (now - fpsData.lastTime >= 1000) {
        setFps(fpsData.frames)
        fpsData.frames = 0
        fpsData.lastTime = now
      }

      // Hold-to-clear for "del": sustained gesture wipes the whole buffer.
      if (onHoldClearRef.current && framePred && framePred.letter === 'del') {
        if (delHoldStartRef.current === null) {
          delHoldStartRef.current = now
          delWipedRef.current = false
        }
        if (!delWipedRef.current && now - delHoldStartRef.current >= HOLD_DELETE_CLEAR_MS) {
          onHoldClearRef.current()
          delWipedRef.current = true
        }
      } else {
        delHoldStartRef.current = null
        delWipedRef.current = false
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [active, cameraStatus, handTrackerReady, modelStatus, detect, predict, stability])

  return {
    videoRef,
    stream,
    cameraStatus,
    cameraError,
    handTrackerReady,
    handTrackerError,
    modelStatus,
    detect,
    predict,
    landmarks,
    prediction,
    handDetected,
    fps,
  }
}