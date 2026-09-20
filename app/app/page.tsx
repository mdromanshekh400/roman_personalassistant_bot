export default function Home() {
  return (
    <main className="page">
      <section className="card">
        <div className="badge">PERSONAL ASSISTANT</div>

        <h1>Roman Personal Assistant</h1>

        <p>
          Telegram AI assistant backend is ready.
          Connect Vercel, Telegram, OpenAI and Neon
          environment variables to activate it.
        </p>

        <div className="status">
          <span className="dot" />
          API service ready
        </div>
      </section>
    </main>
  );
}
