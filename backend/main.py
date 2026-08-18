"""
FastAPI Backend — Flame Analysis Platform
Provides upload, processing, results, and download endpoints.
"""

import os
import uuid
import json
import threading
import csv
import io
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from video_processor import run_pipeline

# ── Config ──────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
OUTPUT_DIR = os.path.join(DATA_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

# ── In-memory job store ─────────────────────────────────────────────
jobs: Dict[str, Dict[str, Any]] = {}

# ── App ─────────────────────────────────────────────────────────────
app = FastAPI(title="Flame Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def update_progress(job_id: str, status: str, progress: int):
    """Callback used by the pipeline to update job progress."""
    if job_id in jobs:
        jobs[job_id]["status"] = status
        jobs[job_id]["progress"] = progress


# ── Endpoints ───────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for processing."""
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Generate job ID
    job_id = str(uuid.uuid4())[:8]
    save_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")

    # Stream-write to disk
    total_size = 0
    with open(save_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                os.remove(save_path)
                raise HTTPException(status_code=400, detail="File too large (max 500MB)")
            f.write(chunk)

    # Register job
    jobs[job_id] = {
        "id": job_id,
        "filename": file.filename,
        "video_path": save_path,
        "status": "uploaded",
        "progress": 0,
        "results": None,
        "error": None,
    }

    return {"job_id": job_id, "filename": file.filename, "size": total_size}


@app.post("/api/process/{job_id}")
def start_processing(job_id: str, scale: float = 1.0):
    """Start processing a previously uploaded video."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job["status"] not in ("uploaded", "completed", "error"):
        raise HTTPException(status_code=400, detail=f"Job is already {job['status']}")

    job["status"] = "processing"
    job["progress"] = 0
    job["error"] = None

    def _process():
        try:
            job_output_dir = os.path.join(OUTPUT_DIR, job_id)
            results = run_pipeline(
                video_path=job["video_path"],
                output_dir=job_output_dir,
                job_id=job_id,
                scale=scale,
                progress_callback=update_progress,
            )
            job["results"] = results
            job["status"] = "completed"
            job["progress"] = 100
        except Exception as e:
            job["status"] = "error"
            job["error"] = str(e)

    thread = threading.Thread(target=_process, daemon=True)
    thread.start()

    return {"job_id": job_id, "status": "processing"}


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    """Get the current status and progress of a job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "error": job.get("error"),
    }


@app.get("/api/results/{job_id}")
def get_results(job_id: str):
    """Get full results for a completed job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job not completed yet. Status: {job['status']}",
        )

    return job["results"]


@app.get("/api/video/{job_id}")
def get_overlay_video(job_id: str):
    """Download the processed overlay video."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    video_path = os.path.join(OUTPUT_DIR, job_id, f"{job_id}_overlay.mp4")
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Overlay video not found")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"flame_analysis_{job_id}.mp4",
    )


@app.get("/api/download/{job_id}")
def download_csv(job_id: str):
    """Download results as CSV."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job["status"] != "completed" or not job["results"]:
        raise HTTPException(status_code=400, detail="Results not ready")

    time_series = job["results"].get("time_series", [])
    if not time_series:
        raise HTTPException(status_code=404, detail="No data available")

    # Build CSV in memory
    output = io.StringIO()
    fieldnames = [
        "frame", "time", "area", "speed", "perimeter",
        "curvature_mean", "curvature_max", "stability_index",
        "aspect_ratio", "num_contours", "total_flame_area",
        "centroid_x", "centroid_y",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in time_series:
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=flame_data_{job_id}.csv"},
    )


# ── Run ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
