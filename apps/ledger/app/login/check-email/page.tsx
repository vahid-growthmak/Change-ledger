export default function CheckEmailPage() {
  return (
    <main className="max-w-page mx-auto px-5 py-8">
      <div className="bg-sheet rounded-card shadow-card px-6 py-6 max-w-md">
        <h1 className="text-ink text-title font-extrabold tracking-tight">Check your email</h1>
        <p className="text-pencil text-body mt-3">
          A one-tap sign-in link is on its way. It works once and expires in 15 minutes — if it's gone
          by the time you look, come back to{' '}
          <a href="/login" className="text-signal font-medium underline">
            /login
          </a>{' '}
          and ask for a new one.
        </p>
      </div>
    </main>
  );
}
