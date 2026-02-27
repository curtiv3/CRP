export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Upload",
      description:
        "Drag and drop your audio or video file, or paste a YouTube URL. We accept .mp3, .wav, .m4a, and .mp4.",
    },
    {
      number: 2,
      title: "Review",
      description:
        "We transcribe your episode and generate platform-ready content — threads, posts, captions, and drafts. Edit anything inline.",
    },
    {
      number: 3,
      title: "Publish",
      description:
        "Copy to clipboard, download as text, or export. Your content is ready to post wherever your audience is.",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-semibold text-text-primary mb-12">
        How it works
      </h2>
      <div className="grid gap-10 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
              {step.number}
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
