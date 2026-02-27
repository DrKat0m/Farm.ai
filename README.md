# PlantAI Complete

PlantAI is an agricultural intelligence platform that lets users locate their property on a map, draw boundaries, and instantly receive intelligence reports including soil composition, climate profile, NDVI vegetation health, crop recommendations, and 3D farm visualizations.

This repository contains both the **Frontend** (Next.js) and the **Backend** (FastAPI) of the application.

## 📁 Repository Structure

```
.
├── plantai/          # Frontend (Next.js 14, TypeScript, MapLibre, Three.js)
└── plantai-backend/  # Backend (FastAPI, Python 3.11)
```

---

## 🚀 Getting Started

### 1. Frontend Setup (`plantai/`)

The frontend is built with Next.js 14.

1.  **Navigate to directory:**
    ```bash
    cd plantai
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run development server:**
    ```bash
    npm run dev
    ```
4.  **Open in browser:** [http://localhost:3000](http://localhost:3000)

### 2. Backend Setup (`plantai-backend/`)

The backend is a FastAPI service that handles data processing and external API integrations.

1.  **Navigate to directory:**
    ```bash
    cd plantai-backend
    ```
2.  **Create virtual environment:**
    ```bash
    python -m venv venv
    ```
3.  **Activate virtual environment:**
    - Windows: `venv\Scripts\activate`
    - Unix/macOS: `source venv/bin/activate`
4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run the application:**
    ```bash
    python main.py
    ```
    The backend will be available at [http://localhost:8000](http://localhost:8000).

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, MapLibre GL JS, Three.js (React Three Fiber), Zustand, TanStack Query.
- **Backend:** FastAPI (Python), Pydantic, GeoJSON integration.
- **Data Sources:** USDA Soil Data, Open-Meteo, Open-Elevation, Sentinel Hub (NDVI).

---

## 📖 How to Push to GitHub (Instructions for User)

The following steps were performed to consolidate this mono-repository:

1.  **Initialize Git** in the project root:
    ```bash
    git init
    ```
2.  **Remove nested `.git` folders** (if any) to avoid submodules:
    ```bash
    rm -rf plantai/.git plantai-backend/.git
    ```
3.  **Create a root `.gitignore`** to exclude environment files and dependencies.
4.  **Add all files:**
    ```bash
    git add .
    ```
5.  **Commit changes:**
    ```bash
    git commit -m "Initial commit: Consolidate frontend and backend"
    ```
6.  **Add remote and push:**
    ```bash
    git remote add origin https://github.com/thesocialeducator/PLANTAI-COMPLETE.git
    git branch -M main
    git push -u origin main
    ```

---

## 📄 License

This project is licensed under the MIT License.
