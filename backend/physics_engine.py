"""
Physics Engine — Compute physical metrics from flame contours.
Calculates area, centroid, speed, perimeter, curvature, and stability.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple


def compute_area(contour: np.ndarray, scale: float = 1.0) -> float:
    """
    Compute the area enclosed by a contour.
    scale: pixel-to-physical-unit conversion factor (px² → mm² or similar).
    """
    pixel_area = cv2.contourArea(contour)
    return pixel_area * (scale ** 2)


def compute_centroid(contour: np.ndarray) -> Optional[Tuple[float, float]]:
    """
    Compute centroid using image moments.
    Returns (cx, cy) or None if contour has zero area.
    """
    M = cv2.moments(contour)
    if M["m00"] == 0:
        return None
    cx = M["m10"] / M["m00"]
    cy = M["m01"] / M["m00"]
    return (cx, cy)


def compute_perimeter(contour: np.ndarray, scale: float = 1.0) -> float:
    """
    Compute the perimeter (arc length) of a contour.
    """
    pixel_perimeter = cv2.arcLength(contour, closed=True)
    return pixel_perimeter * scale


def compute_speed(
    centroid_prev: Optional[Tuple[float, float]],
    centroid_curr: Optional[Tuple[float, float]],
    dt: float,
    scale: float = 1.0,
) -> float:
    """
    Compute flame propagation speed from centroid displacement.
    Returns speed in physical units per second.
    """
    if centroid_prev is None or centroid_curr is None or dt <= 0:
        return 0.0
    dx = centroid_curr[0] - centroid_prev[0]
    dy = centroid_curr[1] - centroid_prev[1]
    displacement = np.sqrt(dx**2 + dy**2) * scale
    return displacement / dt


def compute_curvature_samples(contour: np.ndarray, n_samples: int = 20) -> List[float]:
    """
    Estimate local curvature at sampled points along the contour.
    Uses the angle between consecutive triplets of points.
    """
    if len(contour) < 3:
        return []

    pts = contour.squeeze()
    if pts.ndim != 2:
        return []

    total_pts = len(pts)
    step = max(1, total_pts // n_samples)
    curvatures = []

    for i in range(0, total_pts, step):
        p1 = pts[(i - step) % total_pts].astype(float)
        p2 = pts[i].astype(float)
        p3 = pts[(i + step) % total_pts].astype(float)

        v1 = p1 - p2
        v2 = p3 - p2

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            curvatures.append(0.0)
            continue

        cos_angle = np.clip(np.dot(v1, v2) / (norm1 * norm2), -1.0, 1.0)
        angle = np.arccos(cos_angle)
        curvatures.append(float(angle))

    return curvatures


def compute_stability_index(areas: List[float], window: int = 10) -> float:
    """
    Compute stability index as the coefficient of variation
    of flame area over a sliding window.
    Lower values = more stable flame.
    """
    if len(areas) < 2:
        return 0.0

    arr = np.array(areas[-window:])
    mean_area = np.mean(arr)
    if mean_area == 0:
        return 0.0

    return float(np.std(arr) / mean_area)


def compute_bounding_box(contour: np.ndarray) -> Tuple[int, int, int, int]:
    """
    Compute axis-aligned bounding box.
    Returns (x, y, w, h).
    """
    return cv2.boundingRect(contour)


def compute_aspect_ratio(contour: np.ndarray) -> float:
    """
    Compute aspect ratio of the flame's bounding box.
    """
    _, _, w, h = compute_bounding_box(contour)
    if h == 0:
        return 0.0
    return float(w) / float(h)


def analyze_frame(
    contours: List[np.ndarray],
    prev_centroid: Optional[Tuple[float, float]],
    dt: float,
    scale: float = 1.0,
    areas_history: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Compute all physics metrics for a single frame.
    Uses the largest contour for primary metrics.
    """
    if not contours:
        return {
            "area": 0.0,
            "centroid": None,
            "speed": 0.0,
            "perimeter": 0.0,
            "curvature_mean": 0.0,
            "curvature_max": 0.0,
            "stability_index": compute_stability_index(areas_history or []),
            "aspect_ratio": 0.0,
            "num_contours": 0,
            "total_flame_area": 0.0,
        }

    primary = contours[0]  # largest contour
    area = compute_area(primary, scale)
    centroid = compute_centroid(primary)
    speed = compute_speed(prev_centroid, centroid, dt, scale)
    perimeter = compute_perimeter(primary, scale)
    curvatures = compute_curvature_samples(primary)
    curvature_mean = float(np.mean(curvatures)) if curvatures else 0.0
    curvature_max = float(np.max(curvatures)) if curvatures else 0.0
    aspect_ratio = compute_aspect_ratio(primary)

    # Total area across all detected flame regions
    total_area = sum(compute_area(c, scale) for c in contours)

    # Update stability
    history = list(areas_history or [])
    history.append(area)
    stability = compute_stability_index(history)

    return {
        "area": round(area, 2),
        "centroid": centroid,
        "speed": round(speed, 4),
        "perimeter": round(perimeter, 2),
        "curvature_mean": round(curvature_mean, 4),
        "curvature_max": round(curvature_max, 4),
        "stability_index": round(stability, 4),
        "aspect_ratio": round(aspect_ratio, 4),
        "num_contours": len(contours),
        "total_flame_area": round(total_area, 2),
    }


def analyze_all_frames(
    frame_results: List[Dict[str, Any]],
    fps: float,
    scale: float = 1.0,
) -> List[Dict[str, Any]]:
    """
    Run physics analysis on all processed frames.
    Returns time-series data with all metrics.
    """
    dt = 1.0 / fps if fps > 0 else 1.0
    prev_centroid = None
    areas_history: List[float] = []
    time_series = []

    for i, fr in enumerate(frame_results):
        contours = fr.get("contours", [])
        metrics = analyze_frame(contours, prev_centroid, dt, scale, areas_history)

        metrics["time"] = round(i * dt, 4)
        metrics["frame"] = i

        # Include flame color distribution
        flame_colors = fr.get("flame_colors", {})
        for color_name, pct in flame_colors.items():
            metrics[f"color_{color_name}"] = pct

        # Serialize centroid for JSON
        if metrics["centroid"] is not None:
            metrics["centroid_x"] = round(metrics["centroid"][0], 2)
            metrics["centroid_y"] = round(metrics["centroid"][1], 2)
        else:
            metrics["centroid_x"] = None
            metrics["centroid_y"] = None

        # Remove raw centroid tuple (not JSON serializable)
        prev_centroid = metrics.pop("centroid")
        areas_history.append(metrics["area"])

        time_series.append(metrics)

    return time_series
