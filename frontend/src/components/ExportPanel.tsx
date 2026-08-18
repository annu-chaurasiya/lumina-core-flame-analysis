import { Download, FileSpreadsheet, Image as Img } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csvUrl } from "@/lib/api";

interface Props { jobId: string | null; done: boolean; }

export function ExportPanel({ jobId, done }: Props) {
  if (!jobId || !done) return null;

  const exportCharts = () => {
    const svgs = document.querySelectorAll(".recharts-surface");
    let exported = 0;
    svgs.forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      // Skip tiny SVGs (icons, etc.)
      if (rect.width < 100 || rect.height < 100) return;

      // Clone SVG and set explicit dimensions
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", String(rect.width));
      clone.setAttribute("height", String(rect.height));
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Inline all computed styles so gradients/fonts render
      const inlineStyles = (src: Element, dest: Element) => {
        const cs = window.getComputedStyle(src);
        let style = "";
        for (let i = 0; i < cs.length; i++) {
          const prop = cs[i];
          style += `${prop}:${cs.getPropertyValue(prop)};`;
        }
        (dest as HTMLElement).setAttribute("style", style);
        const srcKids = src.children;
        const destKids = dest.children;
        for (let i = 0; i < srcKids.length; i++) {
          if (destKids[i]) inlineStyles(srcKids[i], destKids[i]);
        }
      };
      inlineStyles(svg, clone);

      const data = new XMLSerializer().serializeToString(clone);
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        const a = document.createElement("a");
        a.download = `flame_chart_${++exported}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
    });
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1px solid rgba(226,232,240,0.6)', background: 'rgba(248,250,252,0.5)',
    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' as const,
  };

  return (
    <div className="glass-strong" style={{ borderRadius: 16, padding: 20, position: 'sticky', top: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ height: 28, width: 28, borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Download style={{ height: 14, width: 14, color: '#fff' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>Export</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href={csvUrl(jobId)} download style={{ textDecoration: 'none' }}>
          <div
            style={btnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.06)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,250,252,0.5)'; e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)'; }}
          >
            <div style={{ height: 36, width: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSpreadsheet style={{ height: 16, width: 16, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Download CSV</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500 }}>Full time-series data</p>
            </div>
          </div>
        </a>

        <div
          style={btnStyle}
          onClick={exportCharts}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,250,252,0.5)'; e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)'; }}
        >
          <div style={{ height: 36, width: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Img style={{ height: 16, width: 16, color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Export Charts</p>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500 }}>High-res PNG images</p>
          </div>
        </div>
      </div>
    </div>
  );
}
