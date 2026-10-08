export type Microphone = {
  id: string;
  name: string;
  series: string;
  maker: string;
  origin: string;
  snr: number;
  aop: number;
  lfro: number;
  currentHpUa: number;
  currentLpUa: number;
  packageMm: [number, number, number];
  ip57: boolean;
  digital: boolean;
  note: string;
};

export const MICROPHONES: Microphone[] = [
  {
    id: "im72d128",
    name: "IM72D128VV03",
    series: "XENSIV",
    maker: "Infineon",
    origin: "Germany",
    snr: 71.5,
    aop: 128,
    lfro: 11,
    currentHpUa: 430,
    currentLpUa: 160,
    packageMm: [4.0, 3.0, 1.2],
    ip57: true,
    digital: true,
    note: "Highest SNR digital PDM. Component-level IP57. Best outdoor default.",
  },
  {
    id: "spk18r1",
    name: "SPK18R1LM4H-1",
    series: "Hyperion",
    maker: "Syntiant",
    origin: "United States",
    snr: 70.5,
    aop: 128,
    lfro: 21,
    currentHpUa: 500,
    currentLpUa: 180,
    packageMm: [4.0, 3.0, 1.2],
    ip57: false,
    digital: true,
    note: "Best American digital MEMS. Same package as Infineon — easy swap.",
  },
  {
    id: "t5837",
    name: "T5837",
    series: "SmartSound",
    maker: "TDK InvenSense",
    origin: "Japan",
    snr: 68,
    aop: 133,
    lfro: 20,
    currentHpUa: 330,
    currentLpUa: 65,
    packageMm: [3.5, 2.65, 0.98],
    ip57: false,
    digital: true,
    note: "Highest AOP of the set. Strong in wind and loud transients.",
  },
  {
    id: "sph9855",
    name: "SPH9855LM4H-1",
    series: "SiSonic",
    maker: "Syntiant / Knowles",
    origin: "United States",
    snr: 66,
    aop: 132.5,
    lfro: 25,
    currentHpUa: 1000,
    currentLpUa: 260,
    packageMm: [3.5, 2.65, 0.98],
    ip57: false,
    digital: true,
    note: "Automotive AEC-Q103. High AOP, lower SNR. American supply chain.",
  },
];

export const PRESETS = [
  {
    id: "node8",
    name: "Field node",
    detail: "8-mic circular · 8 cm",
    geometry: "circular" as const,
    n: 8,
    spacingCm: 8,
  },
  {
    id: "compact4",
    name: "Compact",
    detail: "4-mic square · 6 cm",
    geometry: "square" as const,
    n: 4,
    spacingCm: 6,
  },
  {
    id: "fence12",
    name: "Fence",
    detail: "12-mic linear · 10 cm",
    geometry: "linear" as const,
    n: 12,
    spacingCm: 10,
  },
  {
    id: "site16",
    name: "Site array",
    detail: "16-mic circular · 12 cm",
    geometry: "circular" as const,
    n: 16,
    spacingCm: 12,
  },
  {
    id: "hex19",
    name: "Honeycomb",
    detail: "19-mic hex · 7 cm",
    geometry: "hex" as const,
    n: 19,
    spacingCm: 7,
  },
  {
    id: "cross9",
    name: "Cross",
    detail: "9-mic cross · 8 cm",
    geometry: "cross" as const,
    n: 9,
    spacingCm: 8,
  },
];

export const SOURCES = [
  { id: "nano", name: "Nano / toy", spl1m: 55, hint: "Tiny whoosh, hard outdoors" },
  { id: "consumer", name: "Consumer quad", spl1m: 70, hint: "DJI Mini class" },
  { id: "large", name: "Large consumer", spl1m: 80, hint: "Inspire / Mavic class" },
  { id: "industrial", name: "Industrial", spl1m: 90, hint: "Heavy lift / gas" },
];

export const ENVIRONMENTS = [
  { id: "calm", name: "Calm", extraDb: 0, alphaMul: 1, hint: "Still air, sheltered" },
  { id: "typical", name: "Typical", extraDb: 8, alphaMul: 1.4, hint: "Light wind, rural" },
  { id: "windy", name: "Windy", extraDb: 16, alphaMul: 2, hint: "Gusts, traffic, open field" },
];
