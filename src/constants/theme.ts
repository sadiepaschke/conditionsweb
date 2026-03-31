import type { ThemeTokens } from "../types";

export const THEME: { dark: ThemeTokens; light: ThemeTokens } = {
  dark: {
    bg: "#0e0d0a",
    surface: "#131210",
    text: "#f0ece0",
    textMuted: "rgba(240,236,224,0.65)",
    textDim: "rgba(240,236,224,0.4)",
    gold: "#cbb26a",
    border: "rgba(203,178,106,0.15)",
    borderAccent: "rgba(203,178,106,0.45)",
  },
  light: {
    bg: "#faf8f2",
    surface: "#ffffff",
    text: "#18150a",
    textMuted: "rgba(24,21,10,0.65)",
    textDim: "rgba(24,21,10,0.42)",
    gold: "#7a5f15",
    border: "rgba(120,95,30,0.18)",
    borderAccent: "rgba(120,95,30,0.5)",
  },
};

export function globalStyles(dark: boolean): string {
  const t = dark ? THEME.dark : THEME.light;
  return `
    body {
      background: ${t.bg};
      color: ${t.text};
      font-family: 'DM Sans', sans-serif;
      margin: 0;
      transition: background 0.3s, color 0.3s;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.15); opacity: 0.6; }
    }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    .typing-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${t.gold};
      opacity: 0.6;
      animation: typingBounce 1.2s ease-in-out infinite;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(232,228,220,0.1)" : "rgba(0,0,0,0.1)"}; border-radius: 2px; }

    textarea::placeholder {
      color: ${t.textDim};
    }

    input:focus, textarea:focus {
      outline: none;
    }
  `;
}
