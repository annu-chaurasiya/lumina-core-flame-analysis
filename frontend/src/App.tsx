import { useState, useCallback, useRef, useEffect } from "react";
import { Flame, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadZone } from "@/components/UploadZone";
import { ProcessingDashboard } from "@/components/ProcessingDashboard";
import { MetricsPanel } from "@/components/MetricsPanel";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { ExportPanel } from "@/components/ExportPanel";
import {
  uploadVideo,
  startProcessing,
  getStatus,
  getResults,
  videoUrl,
  type JobStatus,
  type Results,
} from "@/lib/api";

export default function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [filename, setFilename] = useState<string | null>(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const poll = useRef<number | null>(null);

  const onFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadPct(10);
      setFilename(file.name);
      setStatus("uploading");
      setLogs(["Initiating upload…"]);
      setResults(null);
      setTimeout(() => setUploadPct(50), 300);
      const r = await uploadVideo(file);
      setUploadPct(100);
      setJobId(r.job_id);
      setLogs((p) => [...p, `Uploaded ${(file.size / 1e6).toFixed(1)} MB`, `Job ID: ${r.job_id}`]);
      await startProcessing(r.job_id);
      setStatus("processing");
      setLogs((p) => [...p, "Pipeline started…"]);
    } catch (e: any) {
      setStatus("error");
      setLogs((p) => [...p, `ERROR: ${e.message}`]);
    } finally {
      setUploading(false);
    }
  };

  const tick = useCallback(async () => {
    if (!jobId) return;
    try {
      const d: JobStatus = await getStatus(jobId);
      setStatus(d.status);
      setProgress(d.progress);
      if (d.status === "completed") {
        const r = await getResults(jobId);
        setResults(r);
        setLogs((p) => [...p, "✓ Analysis complete"]);
      }
      if (d.status === "error") setLogs((p) => [...p, d.error ?? "Unknown error"]);
    } catch {}
  }, [jobId]);

  useEffect(() => {
    if (jobId && !["completed", "error", "idle"].includes(status))
      poll.current = window.setInterval(tick, 1200);
    return () => { if (poll.current) clearInterval(poll.current); };
  }, [jobId, status, tick]);

  return (
    <div className="mesh-bg" style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a' }}>

      {/* ── Header ── */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(226,232,240,0.5)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ height: 38, width: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
              <Flame style={{ height: 20, width: 20, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
              Lumina<span style={{ color: '#f97316' }}>Core</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#64748b', background: 'rgba(241,245,249,0.8)', border: '1px solid #e2e8f0', borderRadius: 999, padding: '6px 14px' }}>
            <Sparkles style={{ height: 14, width: 14, color: '#f97316' }} />
            <span className="hidden sm:inline">Flame Vision Engine</span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 56px' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ marginBottom: 20 }}
          >

          </motion.div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 18 }}>
            Flame Edge Detection
            <br />
            <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>&amp; Analysis</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: '#64748b', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            Upload combustion footage. We extract flame boundaries, compute physics metrics, and visualize everything — instantly.
          </p>
        </motion.div>

        {/* Upload + Processing — Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 64 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <UploadZone onFile={onFile} uploading={uploading} pct={uploadPct} filename={filename} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <ProcessingDashboard jobId={jobId} status={status} progress={progress} logs={logs} />
          </motion.div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#94a3b8', whiteSpace: 'nowrap' as const }}>Analysis Results</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)' }} />
              </div>

              {/* Metrics */}
              <div style={{ marginBottom: 40 }}>
                <MetricsPanel summary={results.summary} />
              </div>

              {/* Charts + Export */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
                <VisualizationPanel data={results.time_series} vUrl={videoUrl(jobId!)} />
                <ExportPanel jobId={jobId} done={status === "completed"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(226,232,240,0.5)', padding: '20px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          LuminaCore &copy; {new Date().getFullYear()} 
        </span>
      </footer>
    </div>
  );
}
