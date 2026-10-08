import type { ReactNode } from "react";
import { formatHz, formatMeters } from "@/lib/array-physics";

/** Values from the calculator, so each formula shows what it evaluates to right now. */
export type LiveValues = {
  tempC: number;
  c: number;
  freqHz: number;
  lambda: number;
  n: number;
  spacingM: number;
  geometryName: string;
  aperture: number;
  fAlias: number;
  nyquistCm: number;
  gain: number;
  micName: string;
  micSnr: number;
  systemSnr: number;
  ein: number;
  alphaDbPerM: number;
  envName: string;
  envExtraDb: number;
  envAlphaMul: number;
  sourceName: string;
  sourceSpl1m: number;
  rangeM: number;
  steerDeg: number;
  beamW: number;
  powerHpMw: number;
  powerLpMw: number;
};

export function FormulasTab({ v }: { v: LiveValues }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
      <p className="text-sm leading-relaxed text-muted">
        Every number on the calculator comes from the equations below. Each card shows the formula,
        what the symbols mean, and the value it gives with your current settings. Numbers in
        brackets link to the references at the bottom of the page.
      </p>

      <Section n={1} title="Speed of sound and wavelength">
        <Formula
          expr={<>c = 331.3 · √(1 + T / 273.15)</>}
          where="T is air temperature in °C, c in m/s. Ideal gas approximation for dry air; humidity and CO2 shift c by well under 1%."
          live={`T = ${v.tempC} °C → c = ${v.c.toFixed(1)} m/s`}
          refs={["kinsler", "cramer"]}
        />
        <Formula
          expr={<>λ = c / f</>}
          where="f is the design frequency."
          live={`f = ${formatHz(v.freqHz)} → λ = ${(v.lambda * 100).toFixed(1)} cm`}
          refs={["kinsler"]}
        />
      </Section>

      <Section n={2} title="Array geometry">
        <Formula
          expr={
            <>
              x<sub>i</sub> = (i − (N − 1)/2) · d
            </>
          }
          where="Linear array: N microphones centered on the origin, pitch d."
          refs={["johnson"]}
        />
        <Formula
          expr={<>r = d / (2 · sin(π / N))</>}
          where="Circular array: radius chosen so neighbouring microphones are a chord d apart."
          refs={["johnson"]}
        />
        <Formula
          expr={
            <>
              D = max<sub>i,j</sub> ‖p<sub>i</sub> − p<sub>j</sub>‖
            </>
          }
          where="Aperture: the largest distance between any two microphones. Square, hexagonal and cross layouts place microphones on a grid of pitch d."
          live={`${v.geometryName}, N = ${v.n}, d = ${(v.spacingM * 100).toFixed(1)} cm → D = ${formatMeters(v.aperture)}`}
        />
      </Section>

      <Section n={3} title="Spatial sampling (Nyquist)">
        <Formula
          expr={
            <>
              d ≤ λ / 2 &nbsp;⇔&nbsp; f<sub>alias</sub> = c / (2 · d<sub>min</sub>)
            </>
          }
          where="d_min is the smallest distance between any two microphones. Above f_alias the array undersamples the wavefield and grating lobes appear in the beam."
          live={`f_alias = ${formatHz(v.fAlias)}; λ/2 at ${formatHz(v.freqHz)} = ${v.nyquistCm.toFixed(1)} cm`}
          refs={["vantrees", "johnson"]}
        />
      </Section>

      <Section n={4} title="Delay and sum beam pattern">
        <Formula
          expr={
            <>
              B(θ) = 20 · log<sub>10</sub> | (1/N) · Σ<sub>i</sub> e
              <sup>
                j k p<sub>i</sub> · (u(θ) − u(θ<sub>s</sub>))
              </sup>{" "}
              |
            </>
          }
          where="k = 2πf / c is the wavenumber, p_i the microphone position, u(θ) = (cos θ, sin θ) the unit vector toward azimuth θ, and θ_s the steering angle. Far field, plane wave, equal weights, evaluated in the array plane at 1° steps."
          refs={["vantrees", "johnson", "brandstein"]}
        />
        <Formula
          expr={
            <>
              BW<sub>−3 dB</sub> = θ<sub>right</sub> − θ<sub>left</sub>
            </>
          }
          where="Found numerically: walk out from the steering angle on each side until B(θ) first drops 3 dB below the peak. Resolution is 1°."
          live={`steer ${v.steerDeg}° → beamwidth ${v.beamW}°`}
          refs={["vantrees"]}
        />
      </Section>

      <Section n={5} title="Array gain, SNR and equivalent input noise">
        <Formula
          expr={
            <>
              G = 10 · log<sub>10</sub>(N)
            </>
          }
          where="White noise gain of delay and sum: the signal adds coherently, uncorrelated self noise adds in power."
          live={`N = ${v.n} → G = +${v.gain.toFixed(1)} dB`}
          refs={["vantrees", "benesty"]}
        />
        <Formula
          expr={
            <>
              SNR<sub>array</sub> = SNR<sub>mic</sub> + G
            </>
          }
          where="SNR_mic is the datasheet value, referenced to a 94 dB SPL, 1 kHz tone and A weighted noise."
          live={`${v.micName}: ${v.micSnr} + ${v.gain.toFixed(1)} = ${v.systemSnr.toFixed(1)} dB`}
          refs={["iec", "lewisSens", "lewisAn", "infineon", "syntiant"]}
        />
        <Formula
          expr={
            <>
              EIN = 94 − SNR<sub>array</sub>
            </>
          }
          where="Equivalent input noise in dB SPL: the acoustic level that would produce the same output as the noise floor."
          live={`EIN = ${v.ein.toFixed(1)} dB SPL`}
          refs={["iec", "lewisSens", "lewisAn"]}
        />
      </Section>

      <Section n={6} title="Propagation and detection range">
        <Formula
          expr={
            <>
              L(r) = L<sub>s</sub> − 20 · log<sub>10</sub>(r / 1 m) − α · r
            </>
          }
          where="L_s is the source level at 1 m, the log term is spherical spreading, α is atmospheric absorption in dB/m."
          refs={["kinsler", "iso2"]}
        />
        <Formula
          expr={
            <>
              α(f) = 0.0012 · (f / 1 kHz)<sup>1.4</sup> · m<sub>env</sub>
            </>
          }
          where="A simplified power law fit, scaled by the environment multiplier m_env. See the note below: it is well below ISO 9613 Part 1."
          live={`${formatHz(v.freqHz)}, ${v.envName} (×${v.envAlphaMul}) → α = ${(v.alphaDbPerM * 1000).toFixed(2)} dB/km`}
          refs={["iso1"]}
        />
        <Formula
          expr={
            <>
              r<sub>max</sub>: L(r) = EIN + M + L<sub>env</sub>
            </>
          }
          where="Detection range is the distance where the received level falls to the noise floor plus a 6 dB margin M and a lumped environment penalty L_env. Solved by bisection between 0.4 m and 8 km."
          live={`${v.sourceName} (${v.sourceSpl1m} dB @ 1 m), ${v.envName} (+${v.envExtraDb} dB) → r_max = ${formatMeters(v.rangeM)}`}
          refs={["kinsler", "iso2"]}
        />
        <Note title="Absorption is underestimated">
          The fitted α is roughly 3 to 4 times lower than ISO 9613 Part 1 at 20 °C and 70% relative
          humidity: 1.2 vs 5.0 dB/km at 1 kHz, 3.2 vs 9.0 dB/km at 2 kHz, 8.4 vs 23 dB/km at 4 kHz.
          Ranges above a few hundred metres, and at higher design frequencies, are therefore
          optimistic.
        </Note>
      </Section>

      <Section n={7} title="Power">
        <Formula
          expr={
            <>
              P = N · I<sub>mic</sub> · 1.8 V
            </>
          }
          where="I_mic is the datasheet supply current in high performance or low power mode. Excludes the ADC, MCU and clocking."
          live={`${v.powerHpMw.toFixed(0)} mW high performance, ${v.powerLpMw.toFixed(0)} mW low power`}
          refs={["infineon", "syntiant", "datasheets"]}
        />
      </Section>

      <Section n={8} title="Assumptions and limits">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Free field, far field, single plane wave; no ground reflection, wind noise or
            turbulence.
          </li>
          <li>
            Microphone self noise is uncorrelated between channels; real arrays share some noise
            (power, clock, wind).
          </li>
          <li>Ideal matched microphones: no gain or phase mismatch, no position error.</li>
          <li>
            Detection is a level threshold, not a classifier; the 6 dB margin is a rule of thumb.
          </li>
          <li>
            Source levels (55 to 90 dB SPL at 1 m) and environment penalties are representative
            assumptions for planning, not measurements. Measured small UAV levels are reported in{" "}
            <Cite k="cabell" />.
          </li>
          <li>
            Only delay and sum is modelled. Time delay estimation with generalized cross correlation{" "}
            <Cite k="knapp" />, parametric direction of arrival methods <Cite k="krim" /> and field
            results for acoustic UAV detection and localization <Cite k="baggenstoss" />{" "}
            <Cite k="blanchard" /> <Cite k="sedunov" /> <Cite k="wu" /> <Cite k="itare" />{" "}
            <Cite k="lim" /> <Cite k="varela" /> <Cite k="ghouli" /> are listed for further reading.
          </li>
        </ul>
      </Section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-fg">References</h2>
        {GROUPS.map((g) => (
          <div key={g.title} className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">{g.title}</h3>
            <ol className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
              {g.items.map((r) => (
                <li key={r.key} id={`ref-${r.key}`} className="flex gap-3 scroll-mt-4">
                  <span className="w-7 shrink-0 font-mono text-xs text-subtle">[{NUM[r.key]}]</span>
                  <span className="min-w-0 break-words">
                    {r.text}
                    {r.link ? (
                      <>
                        {" "}
                        <a
                          href={r.link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-fg underline underline-offset-2"
                        >
                          {r.link.label}
                        </a>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}

type Ref = { key: string; text: string; link?: { label: string; href: string } };
const doi = (d: string) => ({ label: `doi:${d}`, href: `https://doi.org/${d}` });

const GROUPS: { title: string; items: Ref[] }[] = [
  {
    title: "Array signal processing",
    items: [
      {
        key: "vantrees",
        text: "H. L. Van Trees, Optimum Array Processing: Part IV of Detection, Estimation, and Modulation Theory. New York, NY, USA: Wiley-Interscience, 2002.",
        link: doi("10.1002/0471221104"),
      },
      {
        key: "johnson",
        text: "D. H. Johnson and D. E. Dudgeon, Array Signal Processing: Concepts and Techniques. Englewood Cliffs, NJ, USA: Prentice Hall, 1993.",
      },
      {
        key: "brandstein",
        text: "M. Brandstein and D. Ward, Eds., Microphone Arrays: Signal Processing Techniques and Applications. Berlin, Germany: Springer, 2001.",
        link: doi("10.1007/978-3-662-04619-7"),
      },
      {
        key: "krim",
        text: "H. Krim and M. Viberg, “Two decades of array signal processing research: The parametric approach,” IEEE Signal Process. Mag., vol. 13, no. 4, pp. 67–94, Jul. 1996.",
        link: doi("10.1109/79.526899"),
      },
      {
        key: "knapp",
        text: "C. H. Knapp and G. C. Carter, “The generalized correlation method for estimation of time delay,” IEEE Trans. Acoust., Speech, Signal Process., vol. 24, no. 4, pp. 320–327, Aug. 1976.",
        link: doi("10.1109/TASSP.1976.1162830"),
      },
      {
        key: "benesty",
        text: "J. Benesty, J. Chen, and Y. Huang, Microphone Array Signal Processing. Berlin, Germany: Springer, 2008.",
      },
    ],
  },
  {
    title: "Propagation and microphone ratings",
    items: [
      {
        key: "kinsler",
        text: "L. E. Kinsler, A. R. Frey, A. B. Coppens, and J. V. Sanders, Fundamentals of Acoustics, 4th ed. New York, NY, USA: Wiley, 2000.",
      },
      {
        key: "cramer",
        text: "O. Cramer, “The variation of the specific heat ratio and the speed of sound in air with temperature, pressure, humidity, and CO2 concentration,” J. Acoust. Soc. Am., vol. 93, no. 5, pp. 2510–2516, 1993.",
        link: doi("10.1121/1.405827"),
      },
      {
        key: "iso1",
        text: "ISO 9613-1:1993, Acoustics — Attenuation of sound during propagation outdoors — Part 1: Calculation of the absorption of sound by the atmosphere. Geneva, Switzerland: ISO, 1993.",
      },
      {
        key: "iso2",
        text: "ISO 9613-2, Acoustics — Attenuation of sound during propagation outdoors — Part 2: General method of calculation. Geneva, Switzerland: ISO.",
      },
      {
        key: "iec",
        text: "IEC 60268-4, Sound system equipment — Part 4: Microphones. Geneva, Switzerland: IEC.",
      },
      {
        key: "lewisSens",
        text: "J. Lewis, “Understanding microphone sensitivity,” Analog Dialogue, vol. 46, no. 2, Analog Devices, 2012.",
      },
      {
        key: "lewisAn",
        text: "J. Lewis, “Microphone specifications explained,” Application Note AN-1112, Analog Devices / InvenSense.",
      },
    ],
  },
  {
    title: "Acoustic UAV / drone detection",
    items: [
      {
        key: "baggenstoss",
        text: "P. M. Baggenstoss, M. Springer, M. Oispuu, and F. Kurth, “Efficient phase-based acoustic tracking of drones using a microphone array,” in Proc. 27th Eur. Signal Process. Conf. (EUSIPCO), 2019.",
        link: {
          label: "PDF",
          href: "https://www.eurasip.org/Proceedings/Eusipco/eusipco2019/Proceedings/papers/1570529858.pdf",
        },
      },
      {
        key: "blanchard",
        text: "T. Blanchard, J.-H. Thomas, and K. Raoof, “Acoustic localization estimation of an Unmanned Aerial Vehicle using microphone array,” in Proc. INTER-NOISE, Madrid, Spain, 2019, pp. 6656–6667.",
      },
      {
        key: "sedunov",
        text: "N. Sedunov, A. Sutin, H. Salloum, A. Sedunov, and A. Yakubovskiy, “Field test comparison of various acoustic drone detection methods,” J. Acoust. Soc. Am., vol. 146, no. 4_Supplement, p. 2783, 2019.",
        link: doi("10.1121/1.5136640"),
      },
      {
        key: "wu",
        text: "S. Wu, Y. Zheng, K. Ye, H. Cao, X. Zhang, and H. Sun, “Sound source localization for unmanned aerial vehicles in low signal-to-noise ratio environments,” Remote Sens., vol. 16, no. 11, p. 1847, 2024.",
        link: doi("10.3390/rs16111847"),
      },
      {
        key: "itare",
        text: "N. Itare, J.-H. Thomas, and K. Raoof, “Genetic algorithm-based acoustic array optimization for estimating UAV DOA using beamforming,” Drones, vol. 9, no. 2, p. 149, 2025.",
        link: doi("10.3390/drones9020149"),
      },
      {
        key: "lim",
        text: "J. Lim, J. Joo, and S. C. Kim, “Performance enhancement of drone acoustic source localization through distributed microphone arrays,” Sensors, vol. 25, no. 6, p. 1928, 2025.",
        link: doi("10.3390/s25061928"),
      },
      {
        key: "varela",
        text: "M. Varela and W.-D. Wirth, “Advancing direction estimation for drone detection in noisy outdoor environments,” in Proc. Forum Acusticum, Málaga, Spain, Jun. 2025.",
        link: {
          label: "PDF",
          href: "https://dael.euracoustics.org/confs/fa2025/data/articles/000108.pdf",
        },
      },
      {
        key: "ghouli",
        text: "Z. Ghouli, “Passive acoustic detection and localization of drones using MEMS microphones and machine learning,” Acta Acust., vol. 10, art. 12, 2026.",
        link: doi("10.1051/aacus/2026008"),
      },
      {
        key: "cabell",
        text: "R. Cabell, R. McSwain, and F. Grosveld, “Measured noise from small unmanned aerial vehicles,” in Proc. NOISE-CON, 2016. NASA NTRS 20160010139.",
        link: { label: "NTRS", href: "https://ntrs.nasa.gov/citations/20160010139" },
      },
    ],
  },
  {
    title: "Datasheets",
    items: [
      {
        key: "infineon",
        text: "Infineon Technologies AG, IM72D128V XENSIV digital PDM MEMS microphone datasheet. Munich, Germany.",
        link: { label: "Product page", href: "https://www.infineon.com/part/IM72D128V" },
      },
      {
        key: "syntiant",
        text: "Syntiant Corp., SPK18R1LM4H-1 Hyperion SiSonic digital MEMS microphone datasheet. Irvine, CA, USA.",
      },
      {
        key: "datasheets",
        text: "TDK InvenSense T5837 and Knowles SPH9855LM4H-1 digital MEMS microphone datasheets.",
      },
    ],
  },
];

const NUM: Record<string, number> = Object.fromEntries(
  GROUPS.flatMap((g) => g.items).map((r, i) => [r.key, i + 1]),
);

function Cite({ k }: { k: string }) {
  return (
    <a href={`#ref-${k}`} className="font-mono text-xs text-subtle hover:text-fg">
      [{NUM[k]}]
    </a>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="flex items-baseline gap-3 text-sm font-medium text-fg">
        <span className="font-mono text-xs text-subtle">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Formula({
  expr,
  where,
  live,
  refs,
}: {
  expr: ReactNode;
  where: string;
  live?: string;
  refs?: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="overflow-x-auto font-mono text-base text-fg">{expr}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {where}
        {refs?.length ? (
          <span className="ml-1 font-mono text-xs text-subtle">
            {refs.map((r) => (
              <Cite key={r} k={r} />
            ))}
          </span>
        ) : null}
      </p>
      {live ? <p className="mt-2 font-mono text-xs text-accent tabular-nums">Now: {live}</p> : null}
    </div>
  );
}

function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm leading-relaxed text-warn">
      <strong className="font-medium">{title}.</strong> {children}
    </div>
  );
}
