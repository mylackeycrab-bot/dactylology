export interface Landmark {
  x: number
  y: number
  z: number
}

export interface Prediction {
  letter: string
  confidence: number
  allProbs: Float32Array
}

export type ModelStatus = 'loading' | 'ready' | 'not-found' | 'error'
