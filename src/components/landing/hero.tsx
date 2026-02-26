import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-24 pb-20 text-center sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl leading-tight">
        One episode.
        <br />
        A week of content.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary leading-relaxed">
        Upload your podcast or video. Get ready-to-publish posts for Twitter,
        LinkedIn, Instagram, and your newsletter — in your voice.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/register"
          className="inline-flex rounded-lg bg-brand px-6 py-3 text-base font-medium text-text-inverse transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
        >
          Upload your first episode free
        </Link>
        <span className="text-sm text-text-muted">No credit card required</span>
      </div>

      <div className="mt-16 mx-auto max-w-lg">
        <PipelineVisual />
      </div>
    </section>
  );
}

function PipelineVisual() {
  const platforms = [
    { label: "Twitter", color: "bg-platform-twitter" },
    { label: "LinkedIn", color: "bg-platform-linkedin" },
    { label: "Instagram", color: "bg-platform-instagram" },
    { label: "Newsletter", color: "bg-platform-newsletter" },
    { label: "Blog", color: "bg-platform-blog" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Audio waveform representation */}
      <div className="flex items-center gap-0.5 h-12">
        {Array.from({ length: 32 }).map((_, i) => {
          const height = Math.sin(i * 0.4) * 30 + 20 + Math.sin(i * 0.7) * 10;
          return (
            <div
              key={i}
              className="w-1.5 rounded-full bg-brand/40"
              style={{ height: `${Math.max(4, height)}%` }}
            />
          );
        })}
      </div>
      <div className="text-xs text-text-muted">Your episode</div>

      {/* Arrow */}
      <div className="h-8 w-px bg-border" />
      <div className="text-xs font-medium text-brand">Processed in minutes</div>
      <div className="h-8 w-px bg-border" />

      {/* Platform cards fanning out */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {platforms.map((p) => (
          <span
            key={p.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-bg-surface border border-border px-3 py-1.5 text-xs font-medium text-text-primary shadow-sm"
          >
            <span className={`inline-block h-2 w-2 rounded-full ${p.color}`} />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
