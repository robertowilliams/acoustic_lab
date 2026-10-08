export function BeamPlot({
  pattern,
  steerDeg,
}: {
  pattern: number[];
  steerDeg: number;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = 138;
  const minDb = -30;

  const toXY = (deg: number, db: number) => {
    const clamped = Math.max(db, minDb);
    const t = (clamped - minDb) / -minDb;
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + rMax * t * Math.cos(rad),
      y: cy - rMax * t * Math.sin(rad),
    };
  };

  const d = pattern
    .map((db, i) => {
      const p = toXY(i, db);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ");

  const steer = toXY(steerDeg, 0);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" role="img" aria-label="Beam pattern">
      {[-10, -20, -30].map((db) => {
        const rr = rMax * ((db - minDb) / -minDb);
        return (
          <circle
            key={db}
            cx={cx}
            cy={cy}
            r={rr}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={rMax} fill="none" stroke="var(--color-border)" strokeWidth="1.2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx}
            y1={cy}
            x2={cx + rMax * Math.cos(a)}
            y2={cy - rMax * Math.sin(a)}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        );
      })}
      <path d={`${d} Z`} fill="var(--color-plot)" fillOpacity="0.22" stroke="var(--color-plot)" strokeWidth="1.6" />
      <line
        x1={cx}
        y1={cy}
        x2={steer.x}
        y2={steer.y}
        stroke="var(--color-accent)"
        strokeWidth="1.4"
        strokeDasharray="4 4"
      />
      <text x={cx + rMax + 8} y={cy + 4} fill="var(--color-subtle)" fontSize="10" fontFamily="IBM Plex Mono, monospace">
        0°
      </text>
      <text x={cx - 8} y={cy - rMax - 6} fill="var(--color-subtle)" fontSize="10" fontFamily="IBM Plex Mono, monospace">
        90°
      </text>
      <text x={cx - 18} y={cy + rMax + 14} fill="var(--color-subtle)" fontSize="10" fontFamily="IBM Plex Mono, monospace">
        {minDb} dB
      </text>
    </svg>
  );
}
