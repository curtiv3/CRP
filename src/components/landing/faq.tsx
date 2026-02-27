const faqs = [
  {
    question: "Is this just ChatGPT?",
    answer:
      "No. ChatGPT doesn't know your voice, can't process audio, and can't produce platform-ready content in one click. ContentRepurpose is a full pipeline — upload, transcribe, analyze, generate, edit — purpose-built for podcast and video creators. After a few episodes, it learns your writing style and applies it automatically.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "We accept .mp3, .wav, .m4a audio files and .mp4 video files. You can also paste a YouTube URL and we'll extract the audio automatically.",
  },
  {
    question: "How long does processing take?",
    answer:
      "Most episodes are fully processed in 2-5 minutes — transcription, analysis, and content generation included. You'll see real-time status updates as each step completes.",
  },
  {
    question: "Can I edit the generated content?",
    answer:
      "Yes, everything is editable inline. Click edit on any content piece, make your changes, and it saves instantly. The generated content is a starting point — your voice, your final say.",
  },
  {
    question: "What platforms do you generate content for?",
    answer:
      "Twitter/X (threads and standalone tweets), LinkedIn (long-form posts), Instagram (caption drafts), newsletters, blog posts, and TikTok/YouTube Shorts clip suggestions.",
  },
  {
    question: "What's the style profile?",
    answer:
      "After you process 3-5 episodes and edit the outputs, ContentRepurpose learns your writing patterns — your tone, vocabulary, how you open posts, emoji habits, platform-specific preferences. All future content is generated in your voice, not generic AI output.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-semibold text-text-primary mb-10">
        Questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="text-sm font-semibold text-text-primary">
              {faq.question}
            </h3>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
