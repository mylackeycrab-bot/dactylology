# Dactylology

Browser-based ASL fingerspelling recognizer (A–Z). All processing stays on-device.

**Pipeline:** Webcam → hand landmarks (21 points) → normalize → MLP classifier → stability buffer → display

**Components:**
- **Camera** — webcam capture
- **Hand tracker** — MediaPipe landmark detection
- **Classifier** — TF.js MLP → letter probability
- **Stability buffer** — commits letter after N consistent frames
- **Camera view** — video + skeleton overlay
- **Prediction display** — letter + confidence
- **Sentence builder** — text accumulation with controls

**Non-goals:** phrase translation, motion letters (J, Z), user accounts.
