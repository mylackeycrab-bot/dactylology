import { useEffect, useState } from 'react'

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'insecure'

function isInsecureOrigin(): boolean {
  if (typeof window === 'undefined') return false
  const { protocol, hostname } = window.location
  // Secure contexts include https and loopback (localhost / 127.0.0.1 / ::1).
  if (window.isSecureContext) return false
  if (protocol === 'https:') return false
  return !['localhost', '127.0.0.1', '::1'].includes(hostname)
}

function describeError(err: unknown): { status: CameraStatus; message: string } {
  const name = (err as { name?: string } | null)?.name ?? ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      status: 'denied',
      message: 'Camera permission denied. Allow camera access for this site, or upload an image instead.',
    }
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
    return { status: 'unavailable', message: 'No camera found on this device. You can still upload an image.' }
  }
  if (name === 'NotReadableError') {
    return { status: 'unavailable', message: 'Camera is in use by another app. Close it or upload an image instead.' }
  }
  return {
    status: 'unavailable',
    message: `Camera unavailable${name ? ` (${name})` : ''}. You can still upload an image.`,
  }
}

const INSECURE_MESSAGE =
  'Camera needs a secure context. Open the app via http://localhost:5173, or whitelist this URL in Chrome: chrome://flags/#unsafely-treat-insecure-origin-as-secure. You can also upload an image instead.'

/**
 * Acquires the webcam stream when `active`. Does NOT bind it to a <video>;
 * the caller owns the element and binds via `attachStream(stream)` so the
 * element can mount/unmount (e.g. when toggling live/upload) without losing
 * the stream.
 */
export function useCamera(active: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>(active ? 'requesting' : 'idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) {
      setStream(prev => {
        prev?.getTracks().forEach(t => t.stop())
        return null
      })
      setStatus('idle')
      setError(null)
      return
    }

    // Secure-context gate: getUserMedia is simply unavailable on plain HTTP
    // origins other than loopback. Fail fast with an actionable message.
    if (isInsecureOrigin() || !navigator.mediaDevices?.getUserMedia) {
      setStatus('insecure')
      setError(INSECURE_MESSAGE)
      return
    }

    let active_ = true
    setStatus('requesting')
    setError(null)

    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (!active_) {
          s.getTracks().forEach(t => t.stop())
          return
        }
        setStream(s)
        setStatus('ready')
      } catch (e) {
        if (!active_) return
        const { status, message } = describeError(e)
        setStatus(status)
        setError(message)
      }
    }

    start()

    return () => {
      active_ = false
      setStream(prev => {
        prev?.getTracks().forEach(t => t.stop())
        return null
      })
    }
  }, [active])

  return { stream, status, error }
}