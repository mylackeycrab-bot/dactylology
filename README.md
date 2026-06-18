# Dactylology — ASL Alphabet Recognizer

Real-time American Sign Language fingerspelling recognition in the browser.

## Quick Start

```bash
docker compose up --build
# Open http://localhost:5173
```

If no model is found, download one:

```bash
python3 training/download_model.py
```

## Getting the Model

| Method | How |
|--------|-----|
| **Download pre-trained** | `python3 training/download_model.py` |
| **Train on Kaggle** | Open [`training/asl_training.ipynb`](./training/asl_training.ipynb) on Kaggle → add the ASL Alphabet dataset → run all cells → download `asl_model.zip` → extract to `client/public/model/` |

## Commands

| Action | Command |
|--------|---------|
| Start dev server | `docker compose up --build` |
| Production server | `docker compose -f docker-compose-runtime.yaml up --build` |

## Project Structure

```
dactylology/
├── client/                          ← Web app (React + Vite + Bun)
│   ├── specs/                       ← Design docs
│   ├── src/                         ← React components, hooks, lib
│   ├── public/model/                ← TF.js model files
│   ├── Dockerfile                   ← 3-stage: base / build / runtime
│   └── ...config files
├── training/
│   ├── download_model.py            ← Download pre-trained model
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
        TF.js MLP Classifier
              │
              ▼
        Stability Buffer ──► Sentence Builder
```

## License

MIT
