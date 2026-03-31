import { THEME } from "../../constants/theme";

interface ThemeToggleProps {
  dark: boolean;
  setDark: (dark: boolean) => void;
}

export default function ThemeToggle({ dark, setDark }: ThemeToggleProps) {
  const t = dark ? THEME.dark : THEME.light;
  return (
    <div
      onClick={() => setDark(!dark)}
      style={{
        display: "flex", alignItems: "center", gap: 0,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        borderRadius: 20, padding: 3, cursor: "pointer",
        position: "relative", width: 100, height: 30,
        transition: "background 0.3s",
      }}
    >
      <div style={{
        position: "absolute",
        left: dark ? 52 : 3,
        width: 44, height: 24, borderRadius: 12,
        background: "linear-gradient(135deg, #cbb26a, #c99d28)",
        transition: "left 0.3s ease",
      }} />
      <span style={{
        flex: 1, textAlign: "center", fontSize: 11, fontWeight: 500,
        color: dark ? t.textDim : "#fff",
        position: "relative", zIndex: 1,
        transition: "color 0.3s",
      }}>
        Light
      </span>
      <span style={{
        flex: 1, textAlign: "center", fontSize: 11, fontWeight: 500,
        color: dark ? "#fff" : t.textDim,
        position: "relative", zIndex: 1,
        transition: "color 0.3s",
      }}>
        Dark
      </span>
    </div>
  );
}
