# Dactylology

Browser-based ASL fingerspelling recognizer (A–Z). All processing stays on-device.

**Pipeline:** Webcam → hand landmarks (21 points) → normalize → MLP classifier → stability buffer → display

**Model:** 29 classes — A–Z, `del`, `nothing`, `space`. Trained on the Kaggle ASL Alphabet dataset.

## Components

### Hooks

- **useCamera** — webcam capture via `getUserMedia`, returns a `MediaStream`
- **useHandTracker** — MediaPipe HandLandmarker, runs on a requestAnimationFrame loop, returns 21 normalized landmarks
- **useClassifier** — TF.js MLP model, classifies 63-float normalized landmarks into 29 classes
- **useStability** — accumulates predictions over `STABILITY_HOLD_FRAMES` (28 frames). Commits a letter when the last N frames agree with confidence ≥ 85%. Enforces a cooldown between commits to avoid double-writes.
- **useLiveRecognition** — orchestrates camera → tracker → classifier → stability into a single pipeline. Exposes state (stream, landmarks, prediction, handDetected, fps, camera/model status) for the UI.

### UI Components

- **CameraView** — renders video/canvas overlay with landmark skeleton. Top-right HUD pill shows predicted letter + confidence (colored green/yellow/red). Bottom subtitle shows the committed sentence.
- **LearnView** — ASL alphabet reference and practice.
  - Letter picker (A–Z grid, 13 columns on desktop, 7 on mobile)
  - Tip card (hand-shape description for selected letter)
  - Camera area: placeholder with Practice button when idle; webcam feed
    + confidence HUD when practicing
  - Picture-in-picture: reference hand SVG in bottom-right corner
  - Correct-sign feedback: PIP glows green when selected letter matches
    prediction with ≥ 60% confidence (no stability buffer needed)
  - Stop button (✕) exits practice and turns camera off
  - Clicking a letter in the picker immediately updates the confidence HUD
    target, the PIP image, and the tip
- **SourcePicker** — top tab bar switching between Camera, Upload Image, and Learn modes
- **StatusBar** — model loading status, hand detection indicator, FPS counter

### Data

- **constants.ts** — 29 class labels (A–Z sorted, then del/nothing/space), stability thresholds (85% confidence, 28-frame hold, 20-frame cooldown), MediaPipe hand landmark connections
- **learn.ts** — per-letter hand-shape descriptions and the A–Z letter list
- **normalize.ts** — converts raw landmarks to a 63-float feature vector using wrist-relative translation + inter-finger scaling

### Assets

- `client/public/model/` — TF.js model (model.json + weights)
- `client/public/learn/letters/A.svg` through `Z.svg` — public-domain hand reference SVGs from wpclipart.com (Wikimedia Commons)

## Modes

### Camera (Live)
Real-time sentence builder. Webcam → landmarks → classifier → stability buffer.
Letters commit after 28 consistent high-confidence frames. Sentence text displayed
as a subtitle overlay.

### Upload Image
Single-image mode. User uploads a photo → one-shot landmark detection →
classification. Result displayed with option to add letter to sentence.

### Learn
Reference gallery + practice. No camera until user explicitly clicks Practice.

**Gallery**: Browse A–Z with hand SVGs and textual tips. Letter picker always
visible.

**Practice**: Camera turns on only when Practice button is clicked. HUD shows
confidence for the currently selected letter (from model's raw class
probabilities, not the predicted class). PID hand image glows green on a
correct sign. No auto-advance — stay on the same letter until the user picks a
different one.

## Layout

### Desktop
```
[          A–Z letter picker          ]
[            tip card                 ]
[ ┌─────────────────────────────────┐ ]
[ │  Camera / Placeholder           │ ]
[ │                ┌──────────────┐ │ ]
[ │                │  hand PIP    │ │ ]
[ │                └──────────────┘ │ ]
[ │  ✕ (stop)                       │ ]
[ └─────────────────────────────────┘ ]
```

### Mobile (≤520px)
```
[   A–Z picker (7 cols)   ]
[        tip card         ]
[ ┌─────────┐             ]
[ │  Camera │             ]
[ │   + PIP │             ]
[ └─────────┘             ]
```

## Non-goals
Phrase translation, motion letters (J, Z), user accounts, training in the browser.
