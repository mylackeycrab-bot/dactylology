import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import type { CameraStatus } from '../hooks/useCamera'

export type SourceMode = 'live' | 'image' | 'learn'

interface SourcePickerProps {
  mode: SourceMode
  onModeChange: (mode: SourceMode) => void
  onImageSelected: (file: File) => void
  cameraStatus: CameraStatus
  cameraError: string | null
  hasImage: boolean
}

export function SourcePicker({
  mode,
  onModeChange,
  onImageSelected,
  cameraStatus,
  cameraError,
  hasImage,
}: SourcePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImageSelected(file)
    e.target.value = ''
  }

  const cameraDisabled =
    cameraStatus === 'unavailable' ||
    cameraStatus === 'denied' ||
    cameraStatus === 'insecure'

  return (
    <div className="source-picker">
      <div className="source-picker__tabs">
        <button
          className={'tab' + (mode === 'live' ? ' tab--active' : '')}
          onClick={() => onModeChange('live')}
          disabled={cameraDisabled}
          title={cameraDisabled ? (cameraError ?? 'Camera unavailable') : 'Use webcam'}
        >
          Camera
        </button>
        <button
          className={'tab' + (mode === 'image' ? ' tab--active' : '')}
          onClick={() => onModeChange('image')}
          title="Recognize from an uploaded image"
        >
          Upload Image
        </button>
        <button
          className={'tab' + (mode === 'learn' ? ' tab--active' : '')}
          onClick={() => onModeChange('learn')}
          title="Browse the ASL alphabet and practice"
        >
          Learn
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="source-picker__file"
      />

      {mode === 'image' && (
        <button
          className="btn btn--small"
          onClick={() => fileRef.current?.click()}
          title={hasImage ? 'Choose a different image' : 'Choose an image to analyze'}
        >
          {hasImage ? 'Choose another image' : 'Choose an image…'}
        </button>
      )}

      {cameraError && mode === 'live' && (
        <p className="source-picker__notice">{cameraError}</p>
      )}
    </div>
  )
}