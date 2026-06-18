import { useEffect, useRef, type RefObject } from 'react'
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
  // Local fallback ref so the stream-binding effect always has a target even
  // when the parent doesn't pass a videoRef (e.g. image-only usage).
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  // Canvas resolution matches the source's natural pixels so normalized [0,1]
  // landmark coords draw 1:1. Both the <img>/<video> and the <canvas> overlay
  // use object-fit:contain within a fixed-ratio container, so the skeleton
  // stays aligned with the (possibly letterboxed) image regardless of aspect.
  const canvasW = imageSrc && imageWidth ? imageWidth : 640
  const canvasH = imageSrc && imageHeight ? imageHeight : 480

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
      // Letters, 'space' and 'del' are all shown the same way: word/glyph +
      // confidence, drawn at the same size.
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
      {/* Mirrored media layer: video/image + skeleton canvas. The HUD and
          subtitle live outside this layer so their text isn't flipped. */}
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

      {/* Top HUD: predicted letter + confidence (un-mirrored), captioned
          YouTube/movie-style — a soft black pill behind the text only.
          Only rendered when there's prediction data to show. */}
      {prediction && (
        <div className="camera-view__hud">
          <div className="camera-view__hud-text">{hudContent}</div>
        </div>
      )}

      {/* Bottom subtitle: committed sentence (un-mirrored), captioned
          YouTube/movie-style — a soft black pill behind the text only.
          Only shown when there's committed text (no placeholder). */}
      {sentence ? (
        <div className="camera-view__subtitle">
          <span className="camera-view__subtitle-text">{sentence}</span>
        </div>
      ) : null}
    </div>
  )
}