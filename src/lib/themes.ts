export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  brandRed: string;
  brandRedHover: string;
  brandPurple: string;
  brandCyan: string;
  backgroundColor: string;
  glow1: string;
  glow2: string;
  glow3: string;
}

export const THEME_LIBRARY: ThemeDefinition[] = [
  {
    id: "youtube-red",
    name: "Classic Red",
    description: "Vibrant and high-energy classic YouTube-inspired red style.",
    brandRed: "#ff0055",
    brandRedHover: "#e6004c",
    brandPurple: "#7000ff",
    brandCyan: "#00f0ff",
    backgroundColor: "#06060a",
    glow1: "rgba(255, 0, 85, 0.08)",
    glow2: "rgba(112, 0, 255, 0.08)",
    glow3: "rgba(0, 240, 255, 0.02)",
  },
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    description: "Vibrant cyan, electric hot pink, and neon violet cyberpunk vibe.",
    brandRed: "#00f0ff", // cyan main accent
    brandRedHover: "#00d8e6",
    brandPurple: "#ff00ff", // pink side accent
    brandCyan: "#7000ff",
    backgroundColor: "#030306",
    glow1: "rgba(0, 240, 255, 0.12)",
    glow2: "rgba(255, 0, 255, 0.08)",
    glow3: "rgba(112, 0, 255, 0.03)",
  },
  {
    id: "emerald-mint",
    name: "Emerald Mint",
    description: "Calming deep jade green with fresh mint and teal accents.",
    brandRed: "#10b981", // emerald main accent
    brandRedHover: "#059669",
    brandPurple: "#06b6d4", // teal side accent
    brandCyan: "#34d399",
    backgroundColor: "#040706",
    glow1: "rgba(16, 185, 129, 0.08)",
    glow2: "rgba(6, 182, 212, 0.06)",
    glow3: "rgba(52, 211, 153, 0.02)",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Premium feel featuring amber tones and golden sunset elements.",
    brandRed: "#f59e0b", // amber main accent
    brandRedHover: "#d97706",
    brandPurple: "#ec4899", // sunset rose
    brandCyan: "#eab308",
    backgroundColor: "#080604",
    glow1: "rgba(245, 158, 11, 0.08)",
    glow2: "rgba(236, 72, 153, 0.06)",
    glow3: "rgba(234, 179, 8, 0.02)",
  },
  {
    id: "cosmic-nebula",
    name: "Cosmic Nebula",
    description: "Deep space theme utilizing royal blues and stardust pink.",
    brandRed: "#3b82f6", // royal blue main accent
    brandRedHover: "#2563eb",
    brandPurple: "#ec4899", // stardust hot pink
    brandCyan: "#60a5fa",
    backgroundColor: "#020208",
    glow1: "rgba(59, 130, 246, 0.1)",
    glow2: "rgba(236, 72, 153, 0.08)",
    glow3: "rgba(96, 165, 250, 0.03)",
  },
  {
    id: "crimson-stealth",
    name: "Crimson Stealth",
    description: "Tactical dark steel look with sharp blood-red highlights.",
    brandRed: "#ef4444", // crimson main accent
    brandRedHover: "#dc2626",
    brandPurple: "#27272a", // zinc accent
    brandCyan: "#f43f5e",
    backgroundColor: "#050505",
    glow1: "rgba(239, 68, 68, 0.12)",
    glow2: "rgba(39, 39, 42, 0.08)",
    glow3: "rgba(244, 63, 94, 0.03)",
  },
];
