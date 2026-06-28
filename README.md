# Dactylology — ASL Alphabet Recognizer

Real-time American Sign Language fingerspelling recognition in the browser.
All processing stays on-device — no server round-trips.

## Quick Start

```bash
docker compose up --build
# Open http://localhost:5173
```

The model is included in `client/public/model/`. To train a new one:

```bash
# Open training/asl_training.ipynb on Kaggle → add the ASL Alphabet
# dataset → run all cells → download asl_model.zip → extract to
# client/public/model/
```

## Commands

| Action | Command |
|--------|---------|
| Start dev server | `docker compose up --build` |
| Production server | `docker compose -f docker-compose-runtime.yaml up --build` |
| Build only | `podman exec dactylology_client_1 bun run build` |

## Interface

Three modes accessible via the top tab bar:

### Camera (Live)
Real-time webcam capture. Landmark skeleton drawn over the video.
A stability buffer commits each letter after consistent frames,
building a sentence at the bottom. Requires camera permission.

### Upload Image
Choose a photo of a hand signing an ASL letter. Runs one-shot detection
and classification, then shows the result. No camera needed.

### Learn
ASL alphabet reference and practice. No camera permission required until
you explicitly click **Practice**.

- **Letter picker** — A–Z grid at the top to select a letter
- **Tip card** — short hand-shape description for the selected letter
- **Camera area** — when idle, shows a placeholder with the Practice button;
  once clicked, the webcam starts and the confidence HUD appears in the
  top-right corner
- **Picture-in-picture** — the reference hand SVG sits in the bottom-right
  corner of the camera so you can see the proper hand shape while practicing
- **Confidence HUD** — always shows confidence for the currently selected
  letter (read from the model's raw class probabilities), not whichever
  letter the model happens to predict
- **Correct-sign flash** — the PIP hand image briefly glows green when the
  selected letter is signed with ≥60% confidence
- **Stop button** (✕) — top-right corner of the camera, exits practice
  and turns the camera off

## Project Structure

```
dactylology/
├── client/                          ← Web app (React 19 + Vite + Bun)
│   ├── specs/                       ← Design docs
│   ├── src/
│   │   ├── components/              ← React UI components
│   │   │   ├── CameraView.tsx       ← Video/canvas overlay + HUD
│   │   │   ├── LearnView.tsx        ← Learn tab (gallery + practice)
│   │   │   ├── SourcePicker.tsx     ← Mode tab bar
│   │   │   └── StatusBar.tsx        ← Model/hand status
│   │   ├── hooks/
│   │   │   ├── useCamera.ts         ← Webcam capture
│   │   │   ├── useClassifier.ts     ← TF.js MLP classifier
│   │   │   ├── useHandTracker.ts    ← MediaPipe landmark detection
│   │   │   ├── useLiveRecognition.ts← Combined pipeline
│   │   │   └── useStability.ts      ← Stability buffer
│   │   ├── lib/
│   │   │   ├── constants.ts         ← Labels, thresholds, connections
│   │   │   ├── learn.ts             ← Learn tab data (letters, tips)
│   │   │   └── normalize.ts         ← Landmark normalization
│   │   ├── App.tsx                  ← Root component
│   │   └── main.tsx                 ← Entry point
│   ├── public/
│   │   ├── model/                   ← TF.js model files
│   │   └── learn/letters/           ← A–Z hand reference SVGs
│   ├── Dockerfile                   ← 3-stage: base / build / runtime
│   └── ...config files
├── training/
│   └── asl_training.ipynb           ← Kaggle notebook
├── docker-compose.yaml              ← Dev: client only
├── docker-compose-runtime.yaml      ← Prod: client only
└── README.md
```

## Architecture

```
Webcam ──► MediaPipe HandLandmarker ──► 21 landmarks
               │
               ▼
         Normalize (63 floats)
               │
               ▼
         TF.js MLP Classifier → 29 classes (A–Z + del + nothing + space)
               │
               ▼
         Stability Buffer ──► Sentence Builder
```

In Learn → Practice mode the stability buffer is bypassed. A single
frame whose predicted letter matches the selected letter with ≥60%
confidence triggers the correct-sign flash.

## License

MIT
