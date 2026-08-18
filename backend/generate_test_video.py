import cv2
import numpy as np
import os

# Create a sequence of 60 frames (2 seconds at 30 fps)
fps = 30
duration = 2
frames = []

width = 640
height = 480

for i in range(fps * duration):
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Base background (dark gray)
    frame[:] = (50, 50, 50)
    
    # Animate a simple bright shape (growing and oscillating)
    x = width // 2 + int(np.sin(i * 0.2) * 50)
    y = height // 2 - int(np.cos(i * 0.1) * 30)
    
    base_radius = 50 + int(np.sin(i * 0.3) * 20)
    
    # Core (Bright White)
    cv2.circle(frame, (x, y), int(base_radius * 0.3), (255, 255, 255), -1)
    
    # Inner Flame (Yellow/Orange)
    cv2.circle(frame, (x, y+int(base_radius*0.1)), int(base_radius * 0.6), (0, 200, 255), -1)
    
    # Outer Flare (Red/Orange)
    cv2.ellipse(frame, (x, y-10), (base_radius, int(base_radius*1.5)), 0, 0, 360, (0, 100, 255), -1)
    
    # Add noise for realism
    noise = np.random.normal(0, 15, frame.shape).astype(np.uint8)
    frame = cv2.addWeighted(frame, 0.9, noise, 0.1, 0)
    
    # Blur to soften edges
    frame = cv2.GaussianBlur(frame, (15, 15), 0)
    
    frames.append(frame)

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_path = 'test_flame.mp4'
out = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

for frame in frames:
    out.write(frame)

out.release()
print(f"Generated {out_path} ({len(frames)} frames)")
