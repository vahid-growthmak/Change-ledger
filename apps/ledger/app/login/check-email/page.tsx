export default function CheckEmailPage() {
  return (
    <main className="max-w-page mx-auto px-5 py-8">
      <div className="bg-card border border-rule shadow-card rounded-panel px-6 py-6 max-w-md">
        <h1 className="font-sans text-ink" style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em' }}>
          Check your email
        </h1>
        <p className="font-sans text-mute mt-2" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
          A one-tap sign-in link is on its way. It works once and expires in 15 minutes — if it's gone
          by the time you look, come back to{' '}
          <a href="/login" className="text-signal-ink underline">
            /login
          </a>{' '}
          and ask for a new one.
        </p>
      </div>
    </main>
  );
}
