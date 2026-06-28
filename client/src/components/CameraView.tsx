import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Landmark, Prediction } from '../types'
import { HAND_CONNECTIONS } from '../lib/constants'

interface CameraViewProps {
  /** Live webcam stream to attach to the <video>. Set in live mode. */
  stream?: MediaStream | null
  /** Optional ref to the internal <video> for callers that need to read frames (rAF loop). */
  videoRef?: RefObject<HTMLVideoElement | null>
  /** When set, render this uploaded image instead of the live webcam. */
  imageSrc?: string | null
  /** Natural pixel size of the uploaded image (for canvas + aspect ratio). */
  imageWidth?: number
  imageHeight?: number
  landmarks: Landmark[] | null
  /** Active prediction to stamp on the image HUD (top). */
  prediction?: Prediction | null
  /** Whether a hand is currently detected. */
  handDetected?: boolean
  /** Committed sentence to render as a subtitle (bottom). */
  sentence?: string
  /** Mirror the view (selfie) — true for live webcam, false for uploads. */
  mirror?: boolean
}

const LANDMARK_RADIUS = 4
const STROKE_COLOR = '#00ff88'
const FILL_COLOR = '#ff3366'

function confidenceColor(conf: number): string {
  if (conf >= 0.9) return 'var(--green)'
  if (conf >= 0.7) return 'var(--yellow)'
  return 'var(--red)'
}

/** Glyph/word to stamp on the HUD for a given predicted class. */
function hudGlyph(letter: string): string {
  switch (letter) {
    case 'space':
      return 'SPACE'
    case 'del':
      return 'DEL'
    case 'nothing':
      return '—'
    default:
      return letter.toUpperCase()
  }
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = STROKE_COLOR
  ctx.lineWidth = 2
  for (const [i, j] of HAND_CONNECTIONS) {
    ctx.beginPath()
    ctx.moveTo(landmarks[i].x * w, landmarks[i].y * h)
    ctx.lineTo(landmarks[j].x * w, landmarks[j].y * h)
    ctx.stroke()
  }

  ctx.fillStyle = FILL_COLOR
  for (const lm of landmarks) {
    ctx.beginPath()
    ctx.arc(lm.x * w, lm.y * h, LANDMARK_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function CameraView({
  stream,
  videoRef,
  imageSrc,
  imageWidth,
  imageHeight,
  landmarks,
  prediction = null,
  handDetected = false,
  sentence = '',
  mirror = false,
}: CameraViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Track the live video's native resolution so the canvas bitmap matches its
  // aspect ratio. A ResizeObserver on the video is less reliable than listening
  // to 'loadedmetadata' / 'resize' events on the <video> element itself.
  const [videoSize, setVideoSize] = useState({ w: 640, h: 480 })

  useEffect(() => {
    const video = (videoRef ?? localVideoRef).current
    if (!video) return
    if (video.srcObject !== stream) {
      video.srcObject = stream ?? null
    }
    if (stream) {
      void video.play().catch(() => {
        /* autoplay can reject if not allowed; ignore — user can still upload */
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream])

  // Listen for video metadata / resize so the canvas always mirrors the video's
  // native aspect ratio. This matters most on mobile where camera sensors have
  // very different resolutions from laptop webcams.
  useEffect(() => {
    const video = (videoRef ?? localVideoRef).current
    if (!video || imageSrc) return

    const sync = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoSize({ w: video.videoWidth, h: video.videoHeight })
      }
    }

    video.addEventListener('loadedmetadata', sync)
    video.addEventListener('resize', sync)
    // Also poll in case the events fire before we attach listeners.
    sync()

    return () => {
      video.removeEventListener('loadedmetadata', sync)
      video.removeEventListener('resize', sync)
    }
  }, [stream, imageSrc])

  // Canvas bitmap dimensions — use the source's native resolution so the
  // skeleton's [0,1] coords map 1:1 and CSS object-fit:contain on both the
  // video/img and the overlay keeps them perfectly aligned.
  const canvasW = imageSrc && imageWidth ? imageWidth : videoSize.w
  const canvasH = imageSrc && imageHeight ? imageHeight : videoSize.h

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (!landmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    drawSkeleton(ctx, landmarks, canvas.width, canvas.height)
  }, [landmarks, canvasW, canvasH])

  const isNothing = prediction?.letter === 'nothing'

  let hudContent: React.ReactNode = null
  if (handDetected && prediction) {
    const pct = (prediction.confidence * 100).toFixed(0)
    const color = confidenceColor(prediction.confidence)
    if (isNothing) {
      hudContent = (
        <span className="hud__letter hud__letter--special">
          — <span className="hud__special-caption">Idle</span>
        </span>
      )
    } else {
      const glyph = hudGlyph(prediction.letter)
      hudContent = (
        <>
          <span className="hud__letter" style={{ color }}>{glyph}</span>
          <span className="hud__conf" style={{ color }}>{pct}%</span>
        </>
      )
    }
  }

  return (
    <div className="camera-view">
      <div className={'camera-view__media' + (mirror ? ' camera-view__media--mirror' : '')}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Uploaded hand"
            className="camera-view__image"
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef ?? localVideoRef}
            autoPlay
            muted
            playsInline
            className="camera-view__video"
          />
        )}
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className="camera-view__overlay"
        />
      </div>

      {prediction && (
        <div className="camera-view__hud">
          <div className="camera-view__hud-text">{hudContent}</div>
        </div>
      )}

      {sentence ? (
        <div className="camera-view__subtitle">
          <span className="camera-view__subtitle-text">{sentence}</span>
        </div>
      ) : null}
    </div>
  )
}
