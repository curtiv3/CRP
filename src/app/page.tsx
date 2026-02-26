import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="text-lg font-semibold text-text-primary">
            ContentRepurpose
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 pt-24 pb-16 text-center sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
            One episode.
            <br />A week of content.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
            Upload your podcast or video. Get ready-to-publish posts for
            Twitter, LinkedIn, Instagram, and your newsletter — in your voice.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex rounded-lg bg-brand px-6 py-3 text-base font-medium text-text-inverse transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
            >
              Upload your first episode free
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-text-primary mb-12">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
                1
              </div>
              <h3 className="text-sm font-medium text-text-primary">Upload</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Drag and drop your audio/video file or paste a YouTube URL.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
                2
              </div>
              <h3 className="text-sm font-medium text-text-primary">Review</h3>
              <p className="mt-1 text-sm text-text-secondary">
                We transcribe and generate platform-ready content from your
                episode.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
                3
              </div>
              <h3 className="text-sm font-medium text-text-primary">
                Publish
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Copy, download, or schedule your posts. Done in minutes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-bg-surface py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center text-sm text-text-secondary">
          ContentRepurpose
        </div>
      </footer>
    </div>
  );
}
