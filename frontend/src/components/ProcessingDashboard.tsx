import { Activity, CheckCircle2, Cpu, Terminal, XCircle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props { jobId: string | null; status: string; progress: number; logs: string[]; }

const STEPS = [
  { label: "Extract",  keys: ["extracting_frames","processing_frames","computing_physics","generating_overlay","saving_results","completed"] },
  { label: "Detect",   keys: ["processing_frames","computing_physics","generating_overlay","saving_results","completed"] },
  { label: "Physics",  keys: ["computing_physics","generating_overlay","saving_results","completed"] },
  { label: "Overlay",  keys: ["generating_overlay","saving_results","completed"] },
];

export function ProcessingDashboard({ jobId, status, progress, logs }: Props) {
  const cardStyle: React.CSSProperties = {
    height: '100%', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
  };

  return (
    <div className="glass-strong" style={cardStyle}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ height: 28, width: 28, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu style={{ height: 14, width: 14, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Processing Pipeline</span>
        </div>

        <AnimatePresence mode="wait">
          {!jobId ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 220 }}>
              <Activity style={{ height: 32, width: 32, color: '#d1d5db' }} />
              <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Waiting for upload…</p>
            </motion.div>
          ) : (
            <motion.div key="active" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                    {status === "completed" ? <CheckCircle2 style={{ height: 14, width: 14, color: '#10b981' }} /> :
                     status === "error" ? <XCircle style={{ height: 14, width: 14, color: '#ef4444' }} /> :
                     <Activity style={{ height: 14, width: 14, color: '#3b82f6' }} className="animate-pulse" />}
                    {status.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: status === "completed" ? '#10b981' : '#3b82f6', fontWeight: 700 }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 999, background: status === "completed" ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #818cf8)' }}
                  />
                </div>
              </div>

              {/* Vertical timeline steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {STEPS.map((s, i) => {
                  const done = s.keys.includes(status);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                      <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                        {done ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 style={{ height: 16, width: 16, color: '#10b981' }} />
                          </motion.div>
                        ) : (
                          <Circle style={{ height: 10, width: 10, color: '#d1d5db' }} />
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: done ? 600 : 400, color: done ? '#1e293b' : '#94a3b8' }}>{s.label} Frames</span>
                    </div>
                  );
                })}
              </div>

              {/* Logs terminal */}
              <div style={{ flex: 1, borderRadius: 10, background: '#0f172a', padding: '10px 12px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 10, color: '#34d399', overflowY: 'auto', maxHeight: 110, minHeight: 70 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #1e293b', color: '#475569', fontFamily: "'Inter', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <Terminal style={{ height: 10, width: 10 }} /> Terminal
                </div>
                {logs.length === 0 && <span style={{ color: '#334155' }}>—</span>}
                {logs.map((l, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} style={{ lineHeight: 1.8 }}>
                    <span style={{ color: '#334155', marginRight: 4, userSelect: 'none' }}>$</span>
                    <span style={{ color: l.includes("ERROR") ? '#f87171' : l.includes("✓") ? '#4ade80' : '#34d399' }}>{l}</span>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
