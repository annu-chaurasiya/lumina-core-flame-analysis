\# 🔥 LuminaCore — Flame Edge Detection \& Analysis



LuminaCore is a computer-vision-based platform for analyzing combustion videos.

It detects flame regions, extracts flame boundaries, calculates geometric and temporal

features, and visualizes the results through an interactive web interface.



\## ✨ Features



\- 🎥 Upload combustion videos

\- 🔥 Flame detection using HSV color segmentation

\- 🖼️ Frame preprocessing and resizing

\- 📐 Flame contour and boundary detection

\- 🎨 Flame color distribution analysis

\- 📊 Flame area, perimeter, and speed calculation

\- 📈 Time-series visualization

\- 🧮 Flame stability analysis

\- 🎬 Generate contour-overlay videos

\- 📥 Export analysis data as CSV

\- 💻 Interactive React web interface



\## 🏗️ Architecture



!\[LuminaCore Architecture](assets/architecture.png)



\## 🛠️ Tech Stack



\### Frontend

\- React

\- TypeScript

\- Vite

\- Tailwind CSS



\### Backend

\- Python

\- FastAPI

\- OpenCV

\- NumPy



\### Computer Vision

\- HSV color segmentation

\- Morphological image processing

\- Contour detection

\- Flame color analysis



\### Analysis

\- Flame area

\- Perimeter

\- Centroid

\- Flame speed

\- Temporal variation

\- Stability index



\## 📁 Project Structure



```text

lumina-core-flame-analysis/

│

├── backend/

│   ├── cv\_engine.py

│   ├── physics\_engine.py

│   ├── video\_processor.py

│   └── main.py

│

├── frontend/

│   ├── src/

│   ├── public/

│   └── package.json

│

├── assets/

│   └── architecture.png

│

├── architecture.txt

└── README.md

