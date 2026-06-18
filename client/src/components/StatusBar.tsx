import type { ModelStatus } from '../types'

interface StatusBarProps {
  modelStatus: ModelStatus
  handDetected: boolean
  fps: number | null
}

function modelLabel(status: ModelStatus): { text: string; className: string } {
  switch (status) {
    case 'ready':
      return { text: 'Model Ready', className: 'status--ok' }
    case 'loading':
      return { text: 'Loading Model…', className: 'status--warn' }
    case 'not-found':
      return { text: 'Model Missing', className: 'status--err' }
    case 'error':
      return { text: 'Model Error', className: 'status--err' }
  }
}

export function StatusBar({ modelStatus, handDetected, fps }: StatusBarProps) {
  const model = modelLabel(modelStatus)

  return (
    <header className="status-bar">
      <span className={`status-badge ${model.className}`}>{model.text}</span>
      <span className={`status-badge ${handDetected ? 'status--ok' : 'status--muted'}`}>
        {handDetected ? 'Hand Detected' : 'No Hand'}
      </span>
      {fps !== null && <span className="status-fps">{fps.toFixed(0)} FPS</span>}
    </header>
  )
}
