import { Maximize, Ruler, Activity, TrendingUp, Hexagon, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { Summary } from "@/lib/api";

interface Props { summary: Summary; }

export function MetricsPanel({ summary }: Props) {
  const cards = [
    { label: "Avg Area",      val: summary.avg_area.toFixed(1),     unit: "px²",  Icon: Maximize,  gradient: "linear-gradient(135deg, #f97316, #ef4444)", bg: "rgba(249,115,22,0.06)" },
    { label: "Max Area",      val: summary.max_area.toFixed(1),     unit: "px²",  Icon: Ruler,     gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", bg: "rgba(59,130,246,0.06)" },
    { label: "Avg Speed",     val: summary.avg_speed.toFixed(3),    unit: "px/s", Icon: Activity,  gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", bg: "rgba(236,72,153,0.06)" },
    { label: "Peak Speed",    val: summary.max_speed.toFixed(3),    unit: "px/s", Icon: TrendingUp, gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)", bg: "rgba(139,92,246,0.06)" },
    { label: "Avg Perimeter", val: summary.avg_perimeter.toFixed(1), unit: "px",  Icon: Hexagon,   gradient: "linear-gradient(135deg, #10b981, #14b8a6)", bg: "rgba(16,185,129,0.06)" },
    { label: "Stability",     val: summary.stability_index.toFixed(3), unit: "σ", Icon: Zap,       gradient: "linear-gradient(135deg, #f59e0b, #eab308)", bg: "rgba(245,158,11,0.06)" },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="glass-strong"
          style={{ borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'default', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ height: 30, width: 30, borderRadius: 8, background: c.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <c.Icon style={{ height: 14, width: 14, color: '#fff' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{c.val}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{c.unit}</span>
            </div>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{c.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
