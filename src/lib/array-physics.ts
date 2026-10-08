export type GeometryKind = "linear" | "circular" | "square" | "cross" | "hex";

export type Point = { x: number; y: number };

export const GEOMETRIES: { id: GeometryKind; name: string; blurb: string }[] = [
  { id: "circular", name: "Circular", blurb: "Uniform 360° coverage. Best all-sky node." },
  { id: "linear", name: "Linear", blurb: "Fence / perimeter. Narrow broadside beam." },
  { id: "square", name: "Square grid", blurb: "Planar aperture. Strong 2-D beams." },
  { id: "hex", name: "Hexagonal", blurb: "Dense packing. Efficient aperture." },
  { id: "cross", name: "Cross", blurb: "Two axes. Compact DOA with fewer mics." },
];

export function speedOfSound(tempC: number): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15);
}

export function wavelength(freqHz: number, c: number): number {
  return c / Math.max(freqHz, 1);
}

export function generateGeometry(kind: GeometryKind, n: number, spacingM: number): Point[] {
  const count = Math.max(2, Math.round(n));
  const d = Math.max(spacingM, 0.001);

  switch (kind) {
    case "linear": {
      const start = -((count - 1) * d) / 2;
      return Array.from({ length: count }, (_, i) => ({ x: start + i * d, y: 0 }));
    }
    case "circular": {
      const r = d / (2 * Math.sin(Math.PI / count));
      return Array.from({ length: count }, (_, i) => {
        const a = (2 * Math.PI * i) / count - Math.PI / 2;
        return { x: r * Math.cos(a), y: r * Math.sin(a) };
      });
    }
    case "square": {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const w = (cols - 1) * d;
      const h = (rows - 1) * d;
      const pts: Point[] = [];
      let k = 0;
      for (let r = 0; r < rows && k < count; r++) {
        for (let c = 0; c < cols && k < count; c++) {
          pts.push({ x: c * d - w / 2, y: r * d - h / 2 });
          k++;
        }
      }
      return pts;
    }
    case "cross": {
      const pts: Point[] = [];
      const hasCenter = count % 2 === 1;
      if (hasCenter) pts.push({ x: 0, y: 0 });
      const remaining = count - pts.length;
      const perArm = Math.floor(remaining / 4);
      const extra = remaining % 4;
      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      dirs.forEach((dir, idx) => {
        const arm = perArm + (idx < extra ? 1 : 0);
        for (let i = 1; i <= arm; i++) {
          pts.push({ x: dir.x * i * d, y: dir.y * i * d });
        }
      });
      return pts;
    }
    case "hex": {
      const pts: Point[] = [{ x: 0, y: 0 }];
      let ring = 1;
      while (pts.length < count) {
        for (let side = 0; side < 6 && pts.length < count; side++) {
          const a0 = (side * Math.PI) / 3;
          const a1 = ((side + 1) * Math.PI) / 3;
          for (let i = 0; i < ring && pts.length < count; i++) {
            const t = i / ring;
            pts.push({
              x: d * ring * ((1 - t) * Math.cos(a0) + t * Math.cos(a1)),
              y: d * ring * ((1 - t) * Math.sin(a0) + t * Math.sin(a1)),
            });
          }
        }
        ring += 1;
      }
      return pts;
    }
  }
}

export function boundingBox(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function apertureMeters(points: Point[]): number {
  let max = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist > max) max = dist;
    }
  }
  return max;
}

export function minSpacing(points: Point[]): number {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (dist > 1e-9 && dist < min) min = dist;
    }
  }
  return min === Infinity ? 0 : min;
}

export function aliasFrequency(spacingM: number, c: number): number {
  return c / (2 * Math.max(spacingM, 1e-6));
}

export function arrayGainDb(n: number): number {
  return 10 * Math.log10(Math.max(n, 1));
}

export function equivalentNoise(snrDb: number, gainDb: number): number {
  return 94 - (snrDb + gainDb);
}

/** Rough ISO-like absorption, dB/m, dry-ish air. */
export function absorptionDbPerM(freqHz: number): number {
  const f = Math.max(freqHz, 100) / 1000;
  return 0.0012 * Math.pow(f, 1.4);
}

export function detectionRangeM(opts: {
  sourceSpl1m: number;
  ein: number;
  marginDb: number;
  extraLossDb: number;
  alphaDbPerM: number;
}): number {
  const threshold = opts.ein + opts.marginDb + opts.extraLossDb;
  let lo = 0.4;
  let hi = 8000;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const received = opts.sourceSpl1m - 20 * Math.log10(mid) - opts.alphaDbPerM * mid;
    if (received >= threshold) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function beamPatternDb(
  points: Point[],
  freqHz: number,
  c: number,
  steerDeg: number,
  steps = 360,
): number[] {
  const k = (2 * Math.PI * freqHz) / c;
  const steer = (steerDeg * Math.PI) / 180;
  const sx = Math.cos(steer);
  const sy = Math.sin(steer);
  const n = Math.max(points.length, 1);
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    const th = (2 * Math.PI * i) / steps;
    const ux = Math.cos(th);
    const uy = Math.sin(th);
    let re = 0;
    let im = 0;
    for (const p of points) {
      const phase = k * (p.x * (ux - sx) + p.y * (uy - sy));
      re += Math.cos(phase);
      im += Math.sin(phase);
    }
    const mag = Math.hypot(re, im) / n;
    out.push(20 * Math.log10(Math.max(mag, 1e-6)));
  }
  return out;
}

/** First −3 dB width around the steer angle, in degrees. */
export function beamwidth3dB(pattern: number[], steerDeg: number): number {
  const steps = pattern.length;
  const steerIdx = ((Math.round(steerDeg) % 360) + 360) % 360;
  const peak = pattern[steerIdx] ?? 0;
  const thresh = peak - 3;
  let left = 0;
  let right = 0;
  for (let i = 1; i < steps / 2; i++) {
    const l = pattern[(steerIdx - i + steps) % steps] ?? -99;
    if (l <= thresh) {
      left = i;
      break;
    }
  }
  for (let i = 1; i < steps / 2; i++) {
    const r = pattern[(steerIdx + i) % steps] ?? -99;
    if (r <= thresh) {
      right = i;
      break;
    }
  }
  const width = left + right;
  return width === 0 ? 360 : width;
}

export function nyquistSpacingM(freqHz: number, c: number): number {
  return c / (2 * Math.max(freqHz, 1));
}

export function formatMeters(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  if (m >= 10) return `${m.toFixed(1)} m`;
  if (m >= 1) return `${m.toFixed(2)} m`;
  return `${(m * 100).toFixed(1)} cm`;
}

export function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`;
  return `${Math.round(hz)} Hz`;
}
