import { useCallback, useEffect, useRef, useState } from 'react'
import type { LiveRecognition } from '../hooks/useLiveRecognition'
import type { Prediction } from '../types'
import { CameraView } from './CameraView'
import { LEARN_LETTERS, PRACTICE_MIN_CONFIDENCE, type LearnLetter } from '../lib/learn'

interface LearnViewProps {
  /** Shared live-recognition pipeline (owned by App). */
  live: LiveRecognition
  /** Whether practice is currently active (drives camera on/off). */
  practice: boolean
  onPracticeChange: (active: boolean) => void
}

export function LearnView({ live, practice, onPracticeChange }: LearnViewProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [flash, setFlash] = useState(false)

  const letters = LEARN_LETTERS
  const selected = letters[selectedIdx]

  const lastScoredTargetRef = useRef<number>(-1)

  const targetLabelIdx = selected.letter.charCodeAt(0) - 65
  const targetConf = live.prediction?.allProbs?.[targetLabelIdx] ?? 0

  const hudPrediction: Prediction | null =
    live.prediction && live.handDetected
      ? { letter: selected.letter, confidence: targetConf, allProbs: live.prediction.allProbs }
      : null

  useEffect(() => {
    if (!practice) return
    const pred = live.prediction
    if (!pred || !live.handDetected) return
    if (pred.letter !== selected.letter) return
    if (pred.confidence < PRACTICE_MIN_CONFIDENCE) return
    if (lastScoredTargetRef.current === selectedIdx) return
    lastScoredTargetRef.current = selectedIdx

    setFlash(true)
    window.setTimeout(() => setFlash(false), 700)
  }, [practice, live.prediction, live.handDetected, selected.letter, selectedIdx])

  const startPractice = useCallback(() => {
    setFlash(false)
    lastScoredTargetRef.current = -1
    onPracticeChange(true)
  }, [onPracticeChange])

  const stopPractice = useCallback(() => {
    onPracticeChange(false)
  }, [onPracticeChange])

  const selectLetter = useCallback((i: number) => {
    setSelectedIdx(i)
    lastScoredTargetRef.current = -1
  }, [])

  return (
    <main className="app__main">
      <section className="learn">
        <LetterPicker selectedIdx={selectedIdx} onSelect={selectLetter} />
        <p className="learn__tip">{selected.tip}</p>

        {!practice ? (
          <div className="learn__camera">
            <div className="camera-view camera-view--placeholder">
              <button
                className="btn"
                onClick={startPractice}
                disabled={live.modelStatus === 'not-found' || live.modelStatus === 'error'}
              >
                Practice
              </button>
            </div>
            <div className="learn__pip">
              <LetterHand letter={selected} />
            </div>
          </div>
        ) : (
          <div className="learn__camera">
            {live.cameraStatus !== 'ready' ? (
              <div className="camera-view camera-view--placeholder">
                <p>{live.cameraError ?? 'Starting camera…'}</p>
              </div>
            ) : (
              <div className="learn__camera-inner">
                <CameraView
                  stream={live.stream}
                  videoRef={live.videoRef}
                  landmarks={live.landmarks}
                  prediction={hudPrediction}
                  handDetected={live.handDetected}
                  sentence=""
                  mirror
                />
              </div>
            )}
            <div className="learn__pip">
              <LetterHand letter={selected} flash={flash} />
            </div>
            <button className="learn__practice-stop" onClick={stopPractice} title="Stop practice">
              ✕
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function LetterHand({ letter, flash }: { letter: LearnLetter; flash?: boolean }) {
  const url = `${import.meta.env.BASE_URL}learn/letters/${letter.letter}.svg`
  return (
    <div className={'learn__pip-img-wrap' + (flash ? ' learn__pip-img-wrap--flash' : '')}>
      <img
        src={url}
        alt={`ASL sign for the letter ${letter.letter}`}
        className="learn__pip-img"
        draggable={false}
      />
    </div>
  )
}

function LetterPicker({
  selectedIdx,
  onSelect,
}: {
  selectedIdx: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="learn__letters">
      {LEARN_LETTERS.map((l, i) => (
        <button
          key={l.letter}
          className={'learn__letter' + (i === selectedIdx ? ' learn__letter--active' : '')}
          onClick={() => onSelect(i)}
        >
          {l.letter}
        </button>
      ))}
    </div>
  )
}
