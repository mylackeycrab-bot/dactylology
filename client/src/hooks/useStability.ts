import { useRef, useCallback, useState } from 'react'
import type { Prediction } from '../types'
import {
  STABILITY_HOLD_FRAMES,
  STABILITY_MIN_CONFIDENCE,
  STABILITY_COOLDOWN_FRAMES,
} from '../lib/constants'

interface UseStabilityOptions {
  holdFrames?: number
  minConfidence?: number
  cooldownFrames?: number
}

export function useStability(options: UseStabilityOptions = {}) {
  const {
    holdFrames = STABILITY_HOLD_FRAMES,
    minConfidence = STABILITY_MIN_CONFIDENCE,
    cooldownFrames = STABILITY_COOLDOWN_FRAMES,
  } = options

  const bufferRef = useRef<string[]>([])
  const cooldownRef = useRef(0)
  const [committed, setCommitted] = useState<string | null>(null)
  const committedRef = useRef<string | null>(null)
  const [current, setCurrent] = useState<string | null>(null)

  const push = useCallback((prediction: Prediction | null) => {
    // Always let the latest observed class drive the live "current" display,
    // even while cooling down, so the HUD reflects what the user is showing.
    if (!prediction || prediction.confidence < minConfidence) {
      bufferRef.current = []
      setCurrent(null)
      return
    }

    if (prediction.letter === 'nothing') {
      bufferRef.current = []
      setCurrent(null)
      return
    }

    setCurrent(prediction.letter)

    // Mandatory gap after the previous commit: don't accumulate the buffer so a
    // held gesture can't immediately re-commit, giving the user time to switch.
    if (cooldownRef.current > 0) {
      cooldownRef.current--
      bufferRef.current = []
      return
    }

    bufferRef.current.push(prediction.letter)

    if (bufferRef.current.length > holdFrames) {
      bufferRef.current.shift()
    }

    if (bufferRef.current.length === holdFrames) {
      const first = bufferRef.current[0]
      const allSame = bufferRef.current.every(l => l === first)
      if (allSame) {
        committedRef.current = first
        setCommitted(first)
        bufferRef.current = []
        cooldownRef.current = cooldownFrames
      }
    }
  }, [holdFrames, minConfidence, cooldownFrames])

  const consume = useCallback(() => {
    const letter = committedRef.current
    committedRef.current = null
    setCommitted(null)
    return letter
  }, [])

  return { committed, current, push, consume }
}