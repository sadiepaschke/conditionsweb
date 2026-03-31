import { THEME } from "../../constants/theme";

interface StartScreenProps {
  onStart: () => void;
  onOpenModal: () => void;
  dark: boolean;
}

export default function StartScreen({ onStart, onOpenModal, dark }: StartScreenProps) {
  const t = dark ? THEME.dark : THEME.light;
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 48, position: "relative",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${t.gold}12 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ maxWidth: 440, textAlign: "center", position: "relative", zIndex: 1 }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 38, lineHeight: 1.15, color: t.text,
          marginBottom: 16, letterSpacing: -0.5,
        }}>
          Map the situation your program is{" "}
          <em style={{ fontStyle: "italic", color: t.gold }}>working within</em>
        </h1>
        <p style={{
          fontSize: 15, lineHeight: 1.7, color: t.textMuted,
          marginBottom: 36, fontWeight: 300,
        }}>
          Positive social change happens within a web of conditions — some your
          program creates, many it inherits. This conversation helps you see the
          full picture so you can strengthen your impact and know what to track
          and measure.
        </p>
        <button
          onClick={onStart}
          style={{
            padding: "14px 32px", fontSize: 14, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            background: "transparent", border: `1px solid ${t.borderAccent}`,
            color: t.gold, borderRadius: 10, cursor: "pointer",
            transition: "all 0.25s", letterSpacing: "0.02em",
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = `${t.gold}18`;
            (e.target as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = "transparent";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          Begin the conversation
        </button>
        <div style={{ marginTop: 20 }}>
          <span
            onClick={onOpenModal}
            style={{
              fontSize: 13, color: t.textDim, cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = t.textMuted; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = t.textDim; }}
          >
            What is this?
          </span>
        </div>
      </div>
    </div>
  );
}
