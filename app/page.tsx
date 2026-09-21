export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h1>🤖 Roman Personal Assistant</h1>

        <p>
          Your personal AI assistant powered by Telegram, OpenAI and Neon.
        </p>

        <p>Backend status: Ready for setup 🚀</p>
      </div>
    </main>
  );
}
