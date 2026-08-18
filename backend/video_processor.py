"""
Video Processor — Orchestrates the full flame analysis pipeline.
Combines CV engine + physics engine, generates overlay video and results JSON.
"""

import os
import json
import cv2
import numpy as np
from typing import Dict, Any, List

from cv_engine import extract_frames, process_all_frames
from physics_engine import analyze_all_frames


def generate_overlay_video(
    frames: List[np.ndarray],
    frame_results: List[Dict[str, Any]],
    physics_data: List[Dict[str, Any]],
    output_path: str,
    fps: float,
    target_width: int = 640,
) -> None:
    """
    Generate browser-compatible H.264 MP4 overlay video.
    """

    if not frames or not frame_results:
        return

    import imageio.v2 as imageio

    first_frame = frame_results[0]["preprocessed"]
    height, width = first_frame.shape[:2]

    fps = fps if fps > 0 else 30.0

    writer = imageio.get_writer(
        output_path,
        format="FFMPEG",
        mode="I",
        fps=fps,
        codec="libx264",
        pixelformat="yuv420p",
        quality=8,
        macro_block_size=1,
    )

    try:
        for i, fr in enumerate(frame_results):

            overlay = fr["preprocessed"].copy()

            # Ensure every frame has identical dimensions
            if overlay.shape[1] != width or overlay.shape[0] != height:
                overlay = cv2.resize(
                    overlay,
                    (width, height),
                    interpolation=cv2.INTER_AREA,
                )

            contours = fr.get("contours", [])

            # Draw flame contours
            if contours:
                cv2.drawContours(
                    overlay,
                    contours,
                    -1,
                    (0, 255, 0),
                    2,
                )

                # Largest contour centroid
                M = cv2.moments(contours[0])

                if M["m00"] > 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])

                    cv2.circle(
                        overlay,
                        (cx, cy),
                        5,
                        (0, 0, 255),
                        -1,
                    )

            # Physics metrics
            if i < len(physics_data):

                pd = physics_data[i]

                texts = [
                    f"Frame: {i}",
                    f"Area: {pd.get('area', 0):.1f} px^2",
                    f"Speed: {pd.get('speed', 0):.3f} px/s",
                    f"Perimeter: {pd.get('perimeter', 0):.1f} px",
                ]

                y_offset = 25

                for txt in texts:

                    cv2.putText(
                        overlay,
                        txt,
                        (10, y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (255, 255, 255),
                        1,
                        cv2.LINE_AA,
                    )

                    y_offset += 22

            # Convert BGR → RGB
            rgb_frame = cv2.cvtColor(
                overlay,
                cv2.COLOR_BGR2RGB,
            )

            # Write frame
            writer.append_data(rgb_frame)

    finally:
        writer.close()

def run_pipeline(
    video_path: str,
    output_dir: str,
    job_id: str,
    scale: float = 1.0,
    target_width: int = 640,
    progress_callback=None,
) -> Dict[str, Any]:
    """
    Full processing pipeline:
    1. Extract frames
    2. Run CV detection
    3. Compute physics
    4. Generate overlay video
    5. Save results JSON
    """
    os.makedirs(output_dir, exist_ok=True)

    # Step 1: Extract frames
    if progress_callback:
        progress_callback(job_id, "extracting_frames", 10)

    frames, fps, orig_w, orig_h = extract_frames(video_path)
    total_frames = len(frames)

    if progress_callback:
        progress_callback(job_id, "processing_frames", 20)

    # Step 2: CV processing
    frame_results = process_all_frames(frames, target_width)

    if progress_callback:
        progress_callback(job_id, "computing_physics", 60)

    # Step 3: Physics analysis
    physics_data = analyze_all_frames(frame_results, fps, scale)

    if progress_callback:
        progress_callback(job_id, "generating_overlay", 80)

    # Step 4: Generate overlay video
    overlay_path = os.path.join(output_dir, f"{job_id}_overlay.mp4")
    generate_overlay_video(frames, frame_results, physics_data, overlay_path, fps, target_width)

    if progress_callback:
        progress_callback(job_id, "saving_results", 90)

    # Step 5: Compute summary stats
    areas = [d["area"] for d in physics_data]
    speeds = [d["speed"] for d in physics_data]
    perimeters = [d["perimeter"] for d in physics_data]

    summary = {
        "total_frames": total_frames,
        "fps": fps,
        "original_resolution": f"{orig_w}x{orig_h}",
        "processing_resolution": target_width,
        "scale_factor": scale,
        "avg_area": round(float(np.mean(areas)), 2) if areas else 0,
        "max_area": round(float(np.max(areas)), 2) if areas else 0,
        "min_area": round(float(np.min(areas)), 2) if areas else 0,
        "avg_speed": round(float(np.mean(speeds)), 4) if speeds else 0,
        "max_speed": round(float(np.max(speeds)), 4) if speeds else 0,
        "avg_perimeter": round(float(np.mean(perimeters)), 2) if perimeters else 0,
        "stability_index": physics_data[-1]["stability_index"] if physics_data else 0,
    }

    # Step 6: Save results
    results = {
        "job_id": job_id,
        "summary": summary,
        "time_series": physics_data,
    }

    results_path = os.path.join(output_dir, f"{job_id}_results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    if progress_callback:
        progress_callback(job_id, "completed", 100)

    return results
