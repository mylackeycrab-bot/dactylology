import { useEffect, useState, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import type { Landmark, ModelStatus, Prediction } from '../types'
import { ASL_LABELS } from '../lib/constants'
import { normalize } from '../lib/normalize'

export function useClassifier() {
  const modelRef = useRef<tf.GraphModel | null>(null)
  const [status, setStatus] = useState<ModelStatus>('loading')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const m = await tf.loadGraphModel(`${import.meta.env.BASE_URL}model/model.json`)
        if (!active) {
          m.dispose()
          return
        }
        modelRef.current = m
        setStatus('ready')
      } catch {
        if (!active) return
        try {
          const resp = await fetch(`${import.meta.env.BASE_URL}model/model.json`, { method: 'HEAD' })
          if (!resp.ok) {
            setStatus('not-found')
          } else {
            setStatus('error')
          }
        } catch {
          setStatus('not-found')
        }
      }
    }

    load()

    return () => {
      active = false
      modelRef.current?.dispose()
    }
  }, [])

  function predict(landmarks: Landmark[]): Prediction | null {
    const model = modelRef.current
    if (!model || landmarks.length !== 21) return null

    const input = normalize(landmarks)
    const tensor = tf.tensor2d([input])
    const output = model.predict(tensor) as tf.Tensor
    const probs = output.dataSync() as Float32Array

    tensor.dispose()
    output.dispose()

    let maxIdx = 0
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i
    }

    return {
      letter: ASL_LABELS[maxIdx] ?? '?',
      confidence: probs[maxIdx],
      allProbs: probs,
    }
  }

  return { predict, status }
}
