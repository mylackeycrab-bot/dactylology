import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useLiveRecognition } from './hooks/useLiveRecognition'
import { StatusBar } from './components/StatusBar'
import { CameraView } from './components/CameraView'
import { SourcePicker, type SourceMode } from './components/SourcePicker'
import type { Landmark, Prediction } from './types'

// Lazy-load the Learn tab so the ~430KB inlined reference SVG only downloads
// when the user actually opens Learn.
const LearnView = lazy(() => import('./components/LearnView').then(m => ({ default: m.LearnView })))

/**
 * Apply a committed (stabilized) class to the sentence.
 * Returns false if it was a no-op (e.g. 'nothing').
 */
function applyCommitted(
  symbol: string,
  append: (s: string) => void,
  backspace: () => void,
): boolean {
  switch (symbol) {
    case 'space':
      append(' ')
      return true
    case 'del':
      backspace()
      return true
    case 'nothing':
      return false
    default:
      append(symbol)
      return true
  }
}

export default function App() {
  const [mode, setMode] = useState<SourceMode>('live')
  const [sentence, setSentence] = useState('')

  // Learn-tab practice substate. The single live pipeline is activated when
  // the user is in live Camera mode OR when they engage Learn → Practice.
  const [learnPractice, setLearnPractice] = useState(false)

  // Image state (image-upload mode)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)
  const [imagePrediction, setImagePrediction] = useState<Prediction | null>(null)
  const [imageLandmarks, setImageLandmarks] = useState<Landmark[] | null>(null)
  const [imageHandDetected, setImageHandDetected] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // Commits are only meaningful for the sentence builder (live Camera mode).
  // In Learn mode correctness is judged from the live prediction directly by
  // LearnView (using a lower, more forgiving confidence threshold).
  const handleCommit = useCallback((letter: string) => {
    if (mode !== 'live') return
    applyCommitted(
      letter,
      s => setSentence(prev => prev + s),
      () => setSentence(prev => prev.slice(0, -1)),
    )
  }, [mode])

  const handleHoldClear = useCallback(() => {
    // Only meaningful in live mode (sentence builder). Ignore otherwise.
    if (mode === 'live') setSentence('')
  }, [mode])

  const live = useLiveRecognition({
    active: mode === 'live' || (mode === 'learn' && learnPractice),
    onCommit: handleCommit,
    onHoldClear: handleHoldClear,
  })

  const { cameraStatus, cameraError, handTrackerError, modelStatus } = live

  // If the camera can't be used, fall back to image mode automatically.
  useEffect(() => {
    if (mode === 'live' && (cameraStatus === 'denied' || cameraStatus === 'unavailable' || cameraStatus === 'insecure')) {
      setMode('image')
    }
  }, [mode, cameraStatus])

  const handleModeChange = useCallback((m: SourceMode) => {
    setMode(m)
    // Leaving the Learn tab turns off practice + its camera.
    if (m !== 'learn') setLearnPractice(false)
  }, [])

  const handleImageSelected = useCallback(
    (file: File) => {
      // Revoke any previous object URL to avoid leaking blob URLs.
      setImageSrc(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setImageError(null)
      setImagePrediction(null)
      setImageLandmarks(null)
      setMode('image')
    },
    [],
  )

  // Decode the uploaded image, run detection + classification once.
  useEffect(() => {
    if (mode !== 'image' || !imageSrc) return
    let cancelled = false

    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      setImageWidth(img.naturalWidth)
      setImageHeight(img.naturalHeight)

      if (!live.handTrackerReady) {
        setImageError('Hand tracker is still loading… please wait.')
        return
      }

      const landmarks = live.detect(img)
      const detected = landmarks !== null
      setImageHandDetected(detected)
      setImageLandmarks(landmarks)

      if (detected) {
        const pred = live.predict(landmarks)
        setImagePrediction(pred)
      } else {
        setImagePrediction(null)
        setImageError('No hand detected in this image. Try another photo.')
      }
    }
    img.onerror = () => {
      if (!cancelled) setImageError('Could not load that image.')
    }
    img.src = imageSrc

    return () => {
      cancelled = true
    }
  }, [mode, imageSrc, live.handTrackerReady, live.detect, live.predict])

  // Revoke the blob URL on unmount / when replaced.
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc)
    }
  }, [imageSrc])

  const handleAddImageLetter = useCallback(() => {
    if (!imagePrediction) return
    applyCommitted(
      imagePrediction.letter,
      s => setSentence(prev => prev + s),
      () => setSentence(prev => prev.slice(0, -1)),
    )
  }, [imagePrediction])

  const handleClearImage = useCallback(() => {
    setImageSrc(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setImagePrediction(null)
    setImageLandmarks(null)
    setImageHandDetected(false)
    setImageError(null)
    setImageWidth(0)
    setImageHeight(0)
  }, [])

  if (modelStatus === 'not-found') {
    return (
      <div className="app">
        <div className="error-screen">
          <h2>Model Not Found</h2>
          <p>The TF.js model is missing from <code>client/public/model/</code>.</p>
          <p>Run <code>python3 training/download_model.py</code> to fetch a pre-trained model, or train your own with the Kaggle notebook in <code>training/</code>, then reload.</p>
        </div>
      </div>
    )
  }

  const isLearn = mode === 'learn'

  return (
    <div className="app">
      <StatusBar modelStatus={modelStatus} handDetected={live.handDetected} fps={mode === 'live' ? live.fps : null} />

      <SourcePicker
        mode={mode}
        onModeChange={handleModeChange}
        onImageSelected={handleImageSelected}
        cameraStatus={cameraStatus}
        cameraError={cameraError}
        hasImage={!!imageSrc}
      />

      {handTrackerError && (
        <div className="notice notice--err">{handTrackerError}</div>
      )}

      {isLearn ? (
        <Suspense fallback={<div className="camera-view camera-view--placeholder"><p>Loading Learn…</p></div>}>
          <LearnView
            live={live}
            practice={learnPractice}
            onPracticeChange={setLearnPractice}
          />
        </Suspense>
      ) : (
        <main className="app__main">
          {mode === 'live' ? (
            <CameraView
              stream={live.stream}
              videoRef={live.videoRef}
              landmarks={live.landmarks}
              prediction={live.prediction}
              handDetected={live.handDetected}
              sentence={sentence}
              mirror
            />
          ) : imageSrc ? (
            <CameraView
              imageSrc={imageSrc}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              landmarks={imageLandmarks}
              prediction={imagePrediction}
              handDetected={imageHandDetected}
              sentence={sentence}
              mirror={false}
            />
          ) : (
            <div className="camera-view camera-view--placeholder">
              <p>Choose an image of a hand signing an ASL letter.</p>
            </div>
          )}

          {mode !== 'live' && imageError && (
            <div className="notice">{imageError}</div>
          )}

          {mode !== 'live' && imagePrediction && (
            <div className="image-actions">
              <button className="btn" onClick={handleAddImageLetter} title="Add this letter to the sentence">
                Add “{imagePrediction.letter === 'space' ? 'SPACE' : imagePrediction.letter === 'del' ? 'DEL' : imagePrediction.letter}” to sentence
              </button>
              <button className="btn" onClick={handleClearImage} title="Remove the image">
                Clear image
              </button>
            </div>
          )}
        </main>
      )}
    </div>
  )
}