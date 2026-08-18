import { useMemo, useState } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Play } from "lucide-react";
import type { DataPoint } from "@/lib/api";

interface Props { data: DataPoint[]; vUrl: string | null; }

export function VisualizationPanel({ data, vUrl }: Props) {
  const [tab, setTab] = useState("area");

  /* Down-sample for rendering perf */
  const pts = useMemo(() => {
    if (data.length <= 250) return data;
    const step = Math.ceil(data.length / 250);
    return data.filter((_, i) => i % step === 0);
  }, [data]);

  /* Stats for reference lines */
  const stats = useMemo(() => {
    if (!data.length) return { avgArea: 0, avgSpeed: 0, avgPerimeter: 0 };
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      avgArea: avg(data.map((d) => d.area)),
      avgSpeed: avg(data.map((d) => d.speed)),
      avgPerimeter: avg(data.map((d) => d.perimeter)),
    };
  }, [data]);

  /* Custom tooltip */
  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}>
        <p style={{ color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace', fontSize: 11 }}>
          t = {Number(label).toFixed(3)} s
        </p>
        {payload.map((e: any, i: number) => (
          <p key={i} style={{ color: e.color, fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span>{e.name}</span>
            <span>{Number(e.value).toFixed(3)}</span>
          </p>
        ))}
      </div>
    );
  };

  /* Shared axis config — research paper style */
  const xAxisProps = {
    dataKey: "time",
    stroke: "#64748b",
    tick: { fontSize: 11, fill: "#475569", fontFamily: "'Inter', sans-serif" },
    axisLine: { stroke: '#94a3b8', strokeWidth: 1 },
    tickLine: { stroke: '#cbd5e1' },
    label: { value: "Time (s)", position: "insideBottomRight" as const, offset: -4, style: { fontSize: 12, fill: '#475569', fontWeight: 600, fontFamily: "'Inter', sans-serif" } },
  };

  const yAxisFn = (label: string) => ({
    stroke: "#64748b",
    tick: { fontSize: 11, fill: "#475569", fontFamily: "'Inter', sans-serif" },
    axisLine: { stroke: '#94a3b8', strokeWidth: 1 },
    tickLine: { stroke: '#cbd5e1' },
    label: { value: label, angle: -90, position: "insideLeft" as const, style: { fontSize: 12, fill: '#475569', fontWeight: 600, fontFamily: "'Inter', sans-serif" }, offset: 10 },
    width: 70,
  });

  const gridProps = { strokeDasharray: "3 6", stroke: "#e2e8f0", vertical: false };
  const chartMargin = { top: 20, right: 24, left: 10, bottom: 30 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Video */}
      {vUrl && (
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="border-b border-slate-100 flex items-center gap-2" style={{ padding: '10px 16px' }}>
            <Play className="h-3.5 w-3.5 text-blue-500" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Contour Overlay Video</span>
          </div>
          <video src={vUrl} controls className="bg-black" style={{ width: '100%', maxHeight: '50vh', display: 'block' }} />
        </Card>
      )}

      {/* Charts */}
      {pts.length > 0 && (
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardContent style={{ padding: '20px 24px' }}>
            {/* Tabs header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <BarChart3 className="h-4 w-4 text-violet-500" />
                Time-Series Analysis
              </h3>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="h-8 gap-2">
                  <TabsTrigger value="area" className="text-[11px] px-2 h-6">Flame Area</TabsTrigger>
                  <TabsTrigger value="speed" className="text-[11px] px-2 h-6">Speed</TabsTrigger>
                  <TabsTrigger value="colors" className="text-[11px] px-2 h-6">Flame Colors</TabsTrigger>
                  <TabsTrigger value="perimeter" className="text-[11px] px-2 h-6">Perimeter</TabsTrigger>
                  <TabsTrigger value="curvature" className="text-[11px] px-2 h-6">Curvature</TabsTrigger>
                  <TabsTrigger value="stability" className="text-[11px] px-2 h-6">Stability</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* ── Area Chart ── */}
            {tab === "area" && (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={pts} margin={chartMargin}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="50%" stopColor="#fb923c" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#fdba74" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisFn("Flame Area (px²)")} />
                  <Tooltip content={<Tip />} />
                  <ReferenceLine y={stats.avgArea} stroke="#f97316" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `μ = ${stats.avgArea.toFixed(1)}`, position: 'right', fill: '#f97316', fontSize: 10, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="area" stroke="#f97316" strokeWidth={2} fill="url(#areaFill)" dot={false} name="Flame Area (px²)" activeDot={{ r: 4, fill: "#f97316", stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* ── Speed Chart ── */}
            {tab === "speed" && (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={pts} margin={chartMargin}>
                  <defs>
                    <linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisFn("Centroid Speed (px/s)")} />
                  <Tooltip content={<Tip />} />
                  <ReferenceLine y={stats.avgSpeed} stroke="#3b82f6" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `μ = ${stats.avgSpeed.toFixed(2)}`, position: 'right', fill: '#3b82f6', fontSize: 10, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} fill="url(#speedFill)" dot={false} name="Centroid Speed (px/s)" activeDot={{ r: 4, fill: "#3b82f6", stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* ── Perimeter Chart ── */}
            {tab === "perimeter" && (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={pts} margin={chartMargin}>
                  <defs>
                    <linearGradient id="perimFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#fde68a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisFn("Boundary Perimeter (px)")} />
                  <Tooltip content={<Tip />} />
                  <ReferenceLine y={stats.avgPerimeter} stroke="#eab308" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `μ = ${stats.avgPerimeter.toFixed(1)}`, position: 'right', fill: '#ca8a04', fontSize: 10, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="perimeter" stroke="#eab308" strokeWidth={2} fill="url(#perimFill)" dot={false} name="Perimeter (px)" activeDot={{ r: 4, fill: "#eab308", stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* ── Curvature Chart — dual trace ── */}
            {tab === "curvature" && (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={pts} margin={chartMargin}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisFn("Curvature (1/px)")} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }} iconType="circle" />
                  <Line type="monotone" dataKey="curvature_mean" stroke="#a855f7" strokeWidth={2} dot={false} name="κ mean (1/px)" />
                  <Line type="monotone" dataKey="curvature_max" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="κ max (1/px)" />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* ── Stability Index Chart ── */}
            {tab === "stability" && (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={pts} margin={chartMargin}>
                  <defs>
                    <linearGradient id="stabFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisFn("Stability Index (σ)")} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="stability_index" stroke="#10b981" strokeWidth={2} fill="url(#stabFill)" dot={false} name="Stability Index (σ)" activeDot={{ r: 4, fill: "#10b981", stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* ── Flame Colors Stacked Area ── */}
            {tab === "colors" && (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={pts} margin={chartMargin} stackOffset="expand">
                  <CartesianGrid {...gridProps} />
                  <XAxis {...xAxisProps} />
                  <YAxis
                    {...yAxisFn("Color Fraction (%)")}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}>
                          <p style={{ color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace', fontSize: 11 }}>t = {Number(label).toFixed(3)} s</p>
                          {payload.map((e: any, i: number) => (
                            <p key={i} style={{ color: e.color, fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                              <span>{e.name}</span>
                              <span>{Number(e.value).toFixed(1)}%</span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }} iconType="circle" />
                  <Area type="monotone" dataKey="color_blue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.85} name="Blue" dot={false} />
                  <Area type="monotone" dataKey="color_white" stackId="1" stroke="#94a3b8" fill="#e2e8f0" fillOpacity={0.85} name="White" dot={false} />
                  <Area type="monotone" dataKey="color_yellow" stackId="1" stroke="#eab308" fill="#facc15" fillOpacity={0.85} name="Yellow" dot={false} />
                  <Area type="monotone" dataKey="color_orange" stackId="1" stroke="#f97316" fill="#fb923c" fillOpacity={0.85} name="Orange" dot={false} />
                  <Area type="monotone" dataKey="color_red" stackId="1" stroke="#ef4444" fill="#f87171" fillOpacity={0.85} name="Red" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Chart caption */}
            <p style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
              Fig. — Temporal evolution of flame parameters. Dashed line indicates mean (μ). Data sampled at {data.length > 0 ? (1 / (data[1]?.time - data[0]?.time || 1)).toFixed(1) : '—'} fps.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
