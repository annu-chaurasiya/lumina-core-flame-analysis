import { useRef, useState } from "react";
import { FileVideo, AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onFile: (f: File) => void;
  uploading: boolean;
  pct: number;
  filename: string | null;
}

export function UploadZone({ onFile, uploading, pct, filename }: Props) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const check = (f: File) => {
    setErr(null);
    if (!f.type.startsWith("video/")) { setErr("Only video files accepted"); return; }
    if (f.size > 500 * 1024 * 1024) { setErr("Max 500 MB"); return; }
    onFile(f);
  };

  const cardStyle: React.CSSProperties = {
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const dropStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    border: `2px dashed ${drag ? '#f97316' : filename ? '#10b981' : '#d1d5db'}`,
    background: drag ? 'rgba(249,115,22,0.04)' : filename ? 'rgba(16,185,129,0.03)' : 'rgba(248,250,252,0.5)',
    padding: '40px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 220,
  };

  return (
    <div className={filename ? "glass-strong" : "gradient-border glass-strong glow-pulse"} style={cardStyle}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ height: 28, width: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UploadCloud style={{ height: 14, width: 14, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Upload Video</span>
        </div>

        {/* Drop area */}
        <div
          style={dropStyle}
          onClick={() => ref.current?.click()}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && !uploading) check(f); }}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDrag(true); }}
          onDragLeave={() => setDrag(false)}
        >
          <input ref={ref} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) check(f); }} />

          <AnimatePresence mode="wait">
            {filename ? (
              <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 style={{ height: 40, width: 40, color: '#10b981' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#065f46', maxWidth: 260, textAlign: 'center', wordBreak: 'break-word' }}>{filename}</p>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Ready for processing</span>
              </motion.div>
            ) : uploading ? (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', height: 52, width: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #f1f5f9' }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #f97316', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>{pct}%</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Uploading…</span>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 50, width: 50, borderRadius: 12, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileVideo style={{ height: 22, width: 22, color: '#94a3b8' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Drop video or click to browse</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {["MP4","AVI","MOV","MKV"].map((t) => (
                    <span key={t} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: '#f1f5f9', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {err && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
            <AlertCircle style={{ height: 13, width: 13, flexShrink: 0 }} /> {err}
          </motion.div>
        )}
      </div>
    </div>
  );
}
