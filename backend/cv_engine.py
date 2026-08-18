"""
CV Engine — Frame extraction, preprocessing, flame detection, contour extraction.
Uses OpenCV for all computer vision operations.
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any


def extract_frames(video_path: str) -> Tuple[List[np.ndarray], float, int, int]:
    """
    Extract all frames from a video file.
    Returns: (frames, fps, width, height)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()

    if len(frames) == 0:
        raise ValueError("No frames extracted from video")

    return frames, fps, width, height


def preprocess_frame(frame: np.ndarray, target_width: int = 640) -> np.ndarray:
    """
    Resize frame and apply Gaussian blur.
    """
    h, w = frame.shape[:2]
    scale = target_width / w
    new_h = int(h * scale)
    resized = cv2.resize(frame, (target_width, new_h), interpolation=cv2.INTER_AREA)
    blurred = cv2.GaussianBlur(resized, (5, 5), 0)
    return blurred


def detect_flame_mask(frame: np.ndarray) -> np.ndarray:
    """
    Detect flame regions using HSV color thresholding.
    Returns a binary mask of detected flame pixels.

    Strategy: combine multiple HSV ranges for all flame colors:
    - Range 1: Bright yellow/orange flames (H: 0-40)
    - Range 2: Red/deep orange flames (H: 160-180, wrapping)
    - Range 3: White-hot flames (low saturation, very high value)
    - Range 4: Blue flames (H: 90-130) — gas/propane combustion
    """
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Bright yellow/white flames
    lower1 = np.array([0, 30, 180])
    upper1 = np.array([40, 255, 255])
    mask1 = cv2.inRange(hsv, lower1, upper1)

    # Red/deep flames (hue wraps around 180)
    lower2 = np.array([160, 30, 180])
    upper2 = np.array([180, 255, 255])
    mask2 = cv2.inRange(hsv, lower2, upper2)

    # Very bright white-hot regions in any hue
    lower3 = np.array([0, 0, 230])
    upper3 = np.array([180, 60, 255])
    mask3 = cv2.inRange(hsv, lower3, upper3)

    # Blue flames (gas/propane combustion)
    lower4 = np.array([90, 50, 130])
    upper4 = np.array([130, 255, 255])
    mask4 = cv2.inRange(hsv, lower4, upper4)

    combined_mask = cv2.bitwise_or(mask1, cv2.bitwise_or(mask2, cv2.bitwise_or(mask3, mask4)))

    return combined_mask


def compute_flame_colors(frame: np.ndarray, mask: np.ndarray) -> Dict[str, float]:
    """
    Analyze the color distribution of detected flame pixels.
    Returns percentage of flame pixels in each color zone.
    """
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    total = max(int(np.sum(mask > 0)), 1)

    # Define color zones in HSV  (only within the flame mask)
    zones = {
        "blue":   ((90, 50, 130), (130, 255, 255)),
        "yellow": ((20, 80, 180), (40, 255, 255)),
        "orange": ((5, 80, 180), (20, 255, 255)),
        "red":    ((0, 80, 150), (5, 255, 255)),
        "white":  ((0, 0, 220), (180, 60, 255)),
    }
    # Also count red wrap-around
    red_wrap = ((160, 80, 150), (180, 255, 255))

    result: Dict[str, float] = {}
    for name, (lo, hi) in zones.items():
        zone_mask = cv2.inRange(hsv, np.array(lo), np.array(hi))
        zone_in_flame = cv2.bitwise_and(zone_mask, mask)
        pct = float(np.sum(zone_in_flame > 0)) / total * 100.0
        if name == "red":
            # add wrap-around red
            wrap = cv2.inRange(hsv, np.array(red_wrap[0]), np.array(red_wrap[1]))
            wrap_in_flame = cv2.bitwise_and(wrap, mask)
            pct += float(np.sum(wrap_in_flame > 0)) / total * 100.0
        result[name] = round(pct, 2)

    return result


def postprocess_mask(mask: np.ndarray) -> np.ndarray:
    """
    Apply morphological operations to clean up the flame mask.
    """
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))

    # Open: remove small noise
    cleaned = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_open, iterations=2)
    # Close: fill small gaps
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_close, iterations=2)

    return cleaned


def find_flame_contours(mask: np.ndarray, min_area: int = 100) -> List[np.ndarray]:
    """
    Find contours in the binary mask. Returns contours sorted by area (largest first).
    Filters out contours below min_area threshold.
    """
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter by area and sort descending
    valid = [c for c in contours if cv2.contourArea(c) >= min_area]
    valid.sort(key=cv2.contourArea, reverse=True)

    return valid


def process_frame(frame: np.ndarray, target_width: int = 640) -> Dict[str, Any]:
    """
    Full CV pipeline for a single frame.
    Returns dict with mask, contours, color distribution, and the preprocessed frame.
    """
    preprocessed = preprocess_frame(frame, target_width)
    raw_mask = detect_flame_mask(preprocessed)
    clean_mask = postprocess_mask(raw_mask)
    contours = find_flame_contours(clean_mask)
    colors = compute_flame_colors(preprocessed, clean_mask)

    return {
        "preprocessed": preprocessed,
        "mask": clean_mask,
        "contours": contours,
        "flame_colors": colors,
    }


def process_all_frames(
    frames: List[np.ndarray], target_width: int = 640
) -> List[Dict[str, Any]]:
    """
    Process all frames through the CV pipeline.
    Returns list of per-frame results.
    """
    results = []
    for frame in frames:
        result = process_frame(frame, target_width)
        results.append(result)
    return results
