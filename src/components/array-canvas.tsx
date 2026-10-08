import type { Point } from "@/lib/array-physics";
import { boundingBox, wavelength } from "@/lib/array-physics";

export function ArrayCanvas({
  points,
  freqHz,
  c,
  spacingM,
}: {
  points: Point[];
  freqHz: number;
  c: number;
  spacingM: number;
}) {
  const box = boundingBox(points);
  const pad = Math.max(box.width, box.height, spacingM) * 0.28 + 0.04;
  const minX = box.minX - pad;
  const minY = box.minY - pad;
  const w = box.width + pad * 2;
  const h = box.height + pad * 2;
  const lambda = wavelength(freqHz, c);
  const scale = Math.max(w, h);
  const r = Math.max(scale * 0.028, 0.006);
  const view = `${minX} ${-minY - h} ${w} ${h}`;

  const ticks: number[] = [];
  const step = niceStep(scale);
  const x0 = Math.ceil((minX + 0.01) / step) * step;
  for (let x = x0; x < minX + w - 0.01; x += step) ticks.push(x);

  return (
    <svg viewBox={view} className="h-full w-full" role="img" aria-label="Microphone array layout">
      <rect x={minX} y={-minY - h} width={w} height={h} fill="var(--color-surface)" />
      {ticks.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          x2={x}
          y1={-minY - h}
          y2={-minY}
          stroke="var(--color-border)"
          strokeWidth={scale * 0.002}
        />
      ))}
      <circle
        cx={0}
        cy={0}
        r={lambda / 2}
        fill="none"
        stroke="var(--color-plot)"
        strokeOpacity={0.35}
        strokeDasharray={`${scale * 0.012} ${scale * 0.01}`}
        strokeWidth={scale * 0.003}
      />
      {points.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${-p.y})`}>
          <circle r={r * 1.7} fill="var(--color-plot)" fillOpacity={0.12} />
          <circle r={r} fill="var(--color-accent)" />
          <circle r={r * 0.28} fill="var(--color-bg)" />
        </g>
      ))}
      <line
        x1={minX + pad * 0.35}
        x2={minX + pad * 0.35 + step}
        y1={-minY - pad * 0.4}
        y2={-minY - pad * 0.4}
        stroke="var(--color-muted)"
        strokeWidth={scale * 0.005}
      />
      <text
        x={minX + pad * 0.35}
        y={-minY - pad * 0.18}
        fill="var(--color-muted)"
        fontSize={scale * 0.045}
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
      >
        {step >= 1 ? `${step.toFixed(1)} m` : `${(step * 100).toFixed(0)} cm`}
      </text>
    </svg>
  );
}

function niceStep(span: number): number {
  const raw = span / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  if (n < 1.5) return pow;
  if (n < 3.5) return 2 * pow;
  if (n < 7.5) return 5 * pow;
  return 10 * pow;
}
