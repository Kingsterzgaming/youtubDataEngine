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
  {
    id: "cyberpunk-hacker",
    name: "Cyberpunk Hacker",
    description: "High-contrast neon yellow, cyan, and electric magenta styling.",
    brandRed: "#fdee06",
    brandRedHover: "#e2d505",
    brandPurple: "#00f0ff",
    brandCyan: "#ff007f",
    backgroundColor: "#0a0910",
    glow1: "rgba(253, 238, 6, 0.12)",
    glow2: "rgba(0, 240, 255, 0.08)",
    glow3: "rgba(255, 0, 127, 0.03)",
  },
  {
    id: "tokyo-midnight",
    name: "Tokyo Midnight",
    description: "Deep Tokyo night navy base with electric violet and orange details.",
    brandRed: "#bb9af7",
    brandRedHover: "#9d7cd8",
    brandPurple: "#2ac3de",
    brandCyan: "#ff9e64",
    backgroundColor: "#1a1b26",
    glow1: "rgba(187, 154, 247, 0.1)",
    glow2: "rgba(42, 195, 222, 0.08)",
    glow3: "rgba(255, 158, 100, 0.03)",
  },
  {
    id: "synthwave-sunset",
    name: "Synthwave Sunset",
    description: "Retro 80s outrun vibe with deep hot pink and neon yellow sunbeams.",
    brandRed: "#ff007f",
    brandRedHover: "#e60072",
    brandPurple: "#ff7c00",
    brandCyan: "#ffe600",
    backgroundColor: "#120124",
    glow1: "rgba(255, 0, 127, 0.12)",
    glow2: "rgba(255, 124, 0, 0.08)",
    glow3: "rgba(255, 230, 0, 0.03)",
  },
  {
    id: "dracula-classic",
    name: "Dracula Midnight",
    description: "Rich purple, gothic pink, and toxic green theme.",
    brandRed: "#bd93f9",
    brandRedHover: "#a074e6",
    brandPurple: "#ff79c6",
    brandCyan: "#50fa7b",
    backgroundColor: "#1e1f29",
    glow1: "rgba(189, 147, 249, 0.1)",
    glow2: "rgba(255, 121, 198, 0.08)",
    glow3: "rgba(80, 250, 123, 0.04)",
  },
  {
    id: "nordic-sage",
    name: "Nordic Sage",
    description: "Earthy forest tones with organic sage green and warm bronze accents.",
    brandRed: "#86efac",
    brandRedHover: "#4ade80",
    brandPurple: "#d97706",
    brandCyan: "#166534",
    backgroundColor: "#080d0a",
    glow1: "rgba(134, 239, 172, 0.08)",
    glow2: "rgba(217, 119, 6, 0.06)",
    glow3: "rgba(22, 101, 52, 0.02)",
  },
  {
    id: "rose-gold-lux",
    name: "Rose Gold Lux",
    description: "Luxurious design with warm champagne gold and premium rose highlights.",
    brandRed: "#e0a996",
    brandRedHover: "#cf927d",
    brandPurple: "#d4af37",
    brandCyan: "#f5f5f7",
    backgroundColor: "#0d0b0a",
    glow1: "rgba(224, 169, 150, 0.1)",
    glow2: "rgba(212, 175, 55, 0.08)",
    glow3: "rgba(245, 245, 247, 0.02)",
  },
  {
    id: "minimalist-silver",
    name: "Minimalist Silver",
    description: "Monochrome slate style with sharp silver and clean white controls.",
    brandRed: "#ffffff",
    brandRedHover: "#e4e4e7",
    brandPurple: "#71717a",
    brandCyan: "#a1a1aa",
    backgroundColor: "#09090b",
    glow1: "rgba(255, 255, 255, 0.08)",
    glow2: "rgba(113, 113, 122, 0.05)",
    glow3: "rgba(161, 161, 170, 0.02)",
  },
];
