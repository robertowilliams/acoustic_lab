"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Copy, Check, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrayCanvas } from "@/components/array-canvas";
import { BeamPlot } from "@/components/beam-plot";
import { SavedConfigs } from "@/components/saved-configs";
import type { SavedConfig } from "@/lib/config-schema";
import { MICROPHONES, PRESETS, SOURCES, ENVIRONMENTS } from "@/lib/microphones";
import {
  GEOMETRIES,
  absorptionDbPerM,
  aliasFrequency,
  apertureMeters,
  arrayGainDb,
  beamPatternDb,
  beamwidth3dB,
  detectionRangeM,
  equivalentNoise,
  formatHz,
  formatMeters,
  generateGeometry,
  minSpacing,
  nyquistSpacingM,
  speedOfSound,
  wavelength,
  type GeometryKind,
} from "@/lib/array-physics";
import { cn } from "@/lib/utils";

export function App() {
  const [micId, setMicId] = useState(MICROPHONES[0].id);
  const [geometry, setGeometry] = useState<GeometryKind>("circular");
  const [n, setN] = useState(8);
  const [spacingCm, setSpacingCm] = useState(8);
  const [tempC, setTempC] = useState(20);
  const [freqHz, setFreqHz] = useState(1000);
  const [steerDeg, setSteerDeg] = useState(90);
  const [sourceId, setSourceId] = useState("consumer");
  const [envId, setEnvId] = useState("typical");
  const [copied, setCopied] = useState(false);

  const mic = MICROPHONES.find((m) => m.id === micId) ?? MICROPHONES[0];
  const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[1];
  const env = ENVIRONMENTS.find((e) => e.id === envId) ?? ENVIRONMENTS[1];
  const spacingM = spacingCm / 100;
  const c = speedOfSound(tempC);
  const points = useMemo(() => generateGeometry(geometry, n, spacingM), [geometry, n, spacingM]);
  const lambda = wavelength(freqHz, c);
  const fAlias = aliasFrequency(minSpacing(points) || spacingM, c);
  const gain = arrayGainDb(points.length);
  const systemSnr = mic.snr + gain;
  const ein = equivalentNoise(mic.snr, gain);
  const alpha = absorptionDbPerM(freqHz) * env.alphaMul;
  const rangeM = detectionRangeM({
    sourceSpl1m: source.spl1m,
    ein,
    marginDb: 6,
    extraLossDb: env.extraDb,
    alphaDbPerM: alpha,
  });
  const aperture = apertureMeters(points);
  const pattern = useMemo(
    () => beamPatternDb(points, freqHz, c, steerDeg),
    [points, freqHz, c, steerDeg],
  );
  const beamW = beamwidth3dB(pattern, steerDeg);
  const aliased = freqHz > fAlias;
  const nyquistCm = nyquistSpacingM(freqHz, c) * 100;
  const powerHpMw = (points.length * mic.currentHpUa * 1.8) / 1000;
  const powerLpMw = (points.length * mic.currentLpUa * 1.8) / 1000;
  const geomMeta = GEOMETRIES.find((g) => g.id === geometry);

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setGeometry(p.geometry);
    setN(p.n);
    setSpacingCm(p.spacingCm);
  }

  function loadConfig(cfg: SavedConfig) {
    if (MICROPHONES.some((m) => m.id === cfg.micId)) setMicId(cfg.micId);
    if (GEOMETRIES.some((g) => g.id === cfg.geometry)) setGeometry(cfg.geometry as GeometryKind);
    setN(cfg.n);
    setSpacingCm(cfg.spacingCm);
    setTempC(cfg.tempC);
    setFreqHz(cfg.freqHz);
    setSteerDeg(cfg.steerDeg);
    if (SOURCES.some((x) => x.id === cfg.sourceId)) setSourceId(cfg.sourceId);
    if (ENVIRONMENTS.some((x) => x.id === cfg.envId)) setEnvId(cfg.envId);
  }

  function snapNyquist() {
    setSpacingCm(Math.round(nyquistCm * 10) / 10);
  }

  async function copyReport() {
    const text = [
      "Aperture — acoustic array report",
      `Geometry: ${geomMeta?.name} · ${points.length} mics · ${spacingCm} cm spacing`,
      `Aperture: ${formatMeters(aperture)}`,
      `Microphone: ${mic.maker} ${mic.name}  SNR ${mic.snr} dB  AOP ${mic.aop} dB SPL`,
      `Speed of sound: ${c.toFixed(1)} m/s at ${tempC} °C`,
      `Design frequency: ${formatHz(freqHz)}  λ = ${(lambda * 100).toFixed(1)} cm`,
      `Spatial Nyquist: ${formatHz(fAlias)}${aliased ? "  (aliased at design freq)" : ""}`,
      `Array gain: +${gain.toFixed(1)} dB  → system SNR ${systemSnr.toFixed(1)} dB`,
      `EIN (array): ${ein.toFixed(1)} dB SPL`,
      `Beamwidth (−3 dB) at ${steerDeg}°: ${beamW}°`,
      `Source: ${source.name} (${source.spl1m} dB SPL @ 1 m)`,
      `Environment: ${env.name}`,
      `Ideal detection range (6 dB margin): ${formatMeters(rangeM)}`,
      `Array power: ${powerHpMw.toFixed(0)} mW high-performance / ${powerLpMw.toFixed(0)} mW low-power @ 1.8 V`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Report copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">Acoustic lab</p>
            <h1 className="mt-1 font-sans text-3xl font-medium tracking-tight text-fg sm:text-4xl">
              Aperture
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Calculate and compare MEMS microphone arrays for outdoor drone detection.
            </p>
          </div>
          <Button variant="secondary" onClick={copyReport} className="shrink-0">
            {copied ? <Check /> : <Copy />}
            Copy report
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
          <SavedConfigs
            current={{ micId, geometry, n, spacingCm, tempC, freqHz, steerDeg, sourceId, envId }}
            onLoad={loadConfig}
          />

          <section className="rounded-xl border border-border bg-surface p-4">
            <Label>Preset</Label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-accent/40"
                >
                  <div className="text-sm font-medium text-fg">{p.name}</div>
                  <div className="text-xs text-subtle">{p.detail}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <Label>Geometry</Label>
            <div className="mt-3 flex flex-col gap-1.5">
              {GEOMETRIES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGeometry(g.id)}
                  className={cn(
                    "rounded-md border px-3 py-2.5 text-left transition-colors",
                    geometry === g.id
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface-2 text-fg hover:border-accent/40",
                  )}
                >
                  <div className="text-sm font-medium">{g.name}</div>
                  <div className={cn("text-xs", geometry === g.id ? "text-accent-fg/70" : "text-subtle")}>
                    {g.blurb}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <Control
              label="Microphones"
              value={`${points.length}`}
            >
              <Slider min={2} max={32} step={1} value={[n]} onValueChange={([v]) => setN(v)} />
            </Control>
            <Control
              label="Spacing"
              value={`${spacingCm.toFixed(1)} cm`}
              action={
                <button type="button" onClick={snapNyquist} className="text-xs text-muted hover:text-fg">
                  Snap to λ/2
                </button>
              }
            >
              <Slider
                min={2}
                max={40}
                step={0.5}
                value={[spacingCm]}
                onValueChange={([v]) => setSpacingCm(v)}
              />
            </Control>
            <Control label="Design frequency" value={formatHz(freqHz)}>
              <Slider
                min={100}
                max={8000}
                step={50}
                value={[freqHz]}
                onValueChange={([v]) => setFreqHz(v)}
              />
            </Control>
            <Control label="Steer" value={`${steerDeg}°`}>
              <Slider min={0} max={359} step={1} value={[steerDeg]} onValueChange={([v]) => setSteerDeg(v)} />
            </Control>
            <Control label="Air temperature" value={`${tempC} °C`}>
              <Slider min={-20} max={45} step={1} value={[tempC]} onValueChange={([v]) => setTempC(v)} />
            </Control>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <Label>Target source</Label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceId(s.id)}
                  className={cn(
                    "rounded-md border px-3 py-2.5 text-left",
                    sourceId === s.id
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface-2 hover:border-accent/40",
                  )}
                >
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className={cn("text-xs", sourceId === s.id ? "text-accent-fg/70" : "text-subtle")}>
                    {s.spl1m} dB @ 1 m
                  </div>
                </button>
              ))}
            </div>
            <Label className="mt-4 block">Outdoors</Label>
            <div className="mt-2 flex flex-col gap-1.5">
              {ENVIRONMENTS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEnvId(e.id)}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2.5",
                    envId === e.id
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface-2 hover:border-accent/40",
                  )}
                >
                  <span className="text-sm font-medium">{e.name}</span>
                  <span className={cn("text-xs", envId === e.id ? "text-accent-fg/70" : "text-subtle")}>
                    {e.hint}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2">
            <figure className="overflow-hidden rounded-xl border border-border bg-surface">
              <figcaption className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-medium">Array plan</span>
                <span className="font-mono text-xs text-subtle">
                  dashed = λ/2 at {formatHz(freqHz)}
                </span>
              </figcaption>
              <div className="aspect-square">
                <ArrayCanvas points={points} freqHz={freqHz} c={c} spacingM={spacingM} />
              </div>
            </figure>
            <figure className="overflow-hidden rounded-xl border border-border bg-surface">
              <figcaption className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-medium">Delay-and-sum beam</span>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-subtle">
                  <Crosshair className="size-3" />
                  {steerDeg}°
                </span>
              </figcaption>
              <div className="aspect-square p-2">
                <BeamPlot pattern={pattern} steerDeg={steerDeg} />
              </div>
            </figure>
          </section>

          {aliased && (
            <p className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
              Design frequency is above the spatial Nyquist ({formatHz(fAlias)}). Grating lobes will appear.
              Increase spacing reduction (try {nyquistCm.toFixed(1)} cm) or lower the analysis band.
            </p>
          )}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Aperture" value={formatMeters(aperture)} />
            <Stat label="Nyquist" value={formatHz(fAlias)} hint={aliased ? "exceeded" : "clean"} warn={aliased} />
            <Stat label="Array gain" value={`+${gain.toFixed(1)} dB`} hint={`${points.length} uncorrelated mics`} />
            <Stat label="System SNR" value={`${systemSnr.toFixed(1)} dB`} />
            <Stat label="Array EIN" value={`${ein.toFixed(1)} dB`} hint="SPL equivalent" />
            <Stat label="Beamwidth" value={`${beamW}°`} hint="−3 dB at steer" />
            <Stat label="Range" value={formatMeters(rangeM)} hint="6 dB margin, free field" />
            <Stat
              label="Array power"
              value={`${powerHpMw.toFixed(0)} mW`}
              hint={`LP ${powerLpMw.toFixed(0)} mW`}
            />
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">Capsule</h2>
              <p className="text-xs text-subtle">Same array, swap the MEMS</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {MICROPHONES.map((m) => {
                const active = m.id === mic.id;
                const g = arrayGainDb(points.length);
                const r = detectionRangeM({
                  sourceSpl1m: source.spl1m,
                  ein: equivalentNoise(m.snr, g),
                  marginDb: 6,
                  extraLossDb: env.extraDb,
                  alphaDbPerM: alpha,
                });
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMicId(m.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors",
                      active
                        ? "border-accent bg-surface-2"
                        : "border-border bg-bg hover:border-accent/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-fg">{m.maker}</div>
                        <div className="font-mono text-xs text-muted">{m.name}</div>
                      </div>
                      <Badge tone={m.origin === "United States" ? "ok" : "neutral"}>{m.origin}</Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                      <div>
                        <dt className="text-subtle">SNR</dt>
                        <dd className="tabular-nums text-fg">{m.snr}</dd>
                      </div>
                      <div>
                        <dt className="text-subtle">AOP</dt>
                        <dd className="tabular-nums text-fg">{m.aop}</dd>
                      </div>
                      <div>
                        <dt className="text-subtle">Range</dt>
                        <dd className="tabular-nums text-fg">{formatMeters(r)}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{m.note}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.ip57 && <Badge tone="ok">IP57</Badge>}
                      {m.digital && <Badge>PDM</Badge>}
                      <Badge>LFRO {m.lfro} Hz</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <p className="pb-8 text-xs leading-relaxed text-subtle">
            Range is an ideal free-field estimate: spherical spreading, frequency-dependent absorption, a 6 dB
            detection margin, and a lumped outdoor penalty. Wind screens, ground bounce, and classification
            thresholds will change the real number. Array gain assumes uncorrelated microphone self-noise.
          </p>
        </div>
      </main>
    </div>
  );
}

function Control({
  label,
  value,
  action,
  children,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          {action}
          <span className="font-mono text-xs tabular-nums text-fg">{value}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
      <div className={cn("mt-1 font-mono text-lg tabular-nums", warn ? "text-warn" : "text-fg")}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-subtle">{hint}</div> : null}
    </div>
  );
}
