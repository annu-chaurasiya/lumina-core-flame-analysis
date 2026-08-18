const API = "/api";

/* ── Types matching backend responses ── */

export interface UploadResponse {
  job_id: string;
  filename: string;
  size: number;
}

export interface JobStatus {
  job_id: string;
  status: string;     // uploaded | processing | extracting_frames | processing_frames | computing_physics | generating_overlay | saving_results | completed | error
  progress: number;
  error: string | null;
}

export interface DataPoint {
  frame: number;
  time: number;
  area: number;
  speed: number;
  perimeter: number;
  curvature_mean: number;
  curvature_max: number;
  stability_index: number;
  aspect_ratio: number;
  num_contours: number;
  total_flame_area: number;
  centroid_x: number | null;
  centroid_y: number | null;
  color_blue: number;
  color_yellow: number;
  color_orange: number;
  color_red: number;
  color_white: number;
}

export interface Summary {
  total_frames: number;
  fps: number;
  original_resolution: string;
  processing_resolution: number;
  scale_factor: number;
  avg_area: number;
  max_area: number;
  min_area: number;
  avg_speed: number;
  max_speed: number;
  avg_perimeter: number;
  stability_index: number;
}

export interface Results {
  job_id: string;
  summary: Summary;
  time_series: DataPoint[];
}

/* ── API functions ── */

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
  return res.json();
}

export async function startProcessing(jobId: string, scale = 1.0): Promise<void> {
  const res = await fetch(`${API}/process/${jobId}?scale=${scale}`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).detail || "Failed to start");
}

export async function getStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API}/status/${jobId}`);
  if (!res.ok) throw new Error((await res.json()).detail || "Status failed");
  return res.json();
}

export async function getResults(jobId: string): Promise<Results> {
  const res = await fetch(`${API}/results/${jobId}`);
  if (!res.ok) throw new Error((await res.json()).detail || "Results failed");
  return res.json();
}

export const videoUrl = (id: string) => `${API}/video/${id}`;
export const csvUrl = (id: string) => `${API}/download/${id}`;
