export function OutputPreview() {
  return (
    <section className="bg-bg-elevated py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-semibold text-text-primary mb-3">
          Real output from a single episode
        </h2>
        <p className="text-center text-sm text-text-secondary mb-10 max-w-lg mx-auto">
          Upload once, get content for every platform. Here&apos;s what a
          30-minute podcast episode produces:
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <TwitterThreadPreview />
          <LinkedInPreview />
          <NewsletterPreview />
          <BlogPreview />
        </div>
      </div>
    </section>
  );
}

function TwitterThreadPreview() {
  const tweets = [
    "Most people think consistency is about discipline.\n\nIt's not. It's about systems.\n\nHere's what I learned after publishing 200 episodes 🧵",
    "When I started my podcast, I'd spend 4 hours on each episode. Recording, editing, show notes, social posts.\n\nThen I realized: the bottleneck wasn't creation. It was distribution.",
    "The best creators I know batch everything. They don't switch between \"create mode\" and \"promote mode.\"\n\nOne session. One workflow. Output everywhere.",
    'My rule now: if it takes more than 10 minutes to turn an episode into social content, the process is broken.\n\nNot the content. The process.',
  ];

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block h-3 w-3 rounded-full bg-platform-twitter" />
        <span className="text-xs font-semibold text-text-primary">
          Twitter Thread
        </span>
        <span className="text-xs text-text-muted font-mono ml-auto">
          {tweets.length} tweets
        </span>
      </div>
      <div className="space-y-3">
        {tweets.map((tweet, i) => (
          <div
            key={i}
            className="rounded-lg bg-bg-primary border border-border/50 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-bg-elevated" />
              <span className="text-xs font-medium text-text-primary">
                You
              </span>
              <span className="text-xs text-text-muted">@you</span>
              <span className="text-xs text-text-muted font-mono ml-auto">
                {i + 1}/{tweets.length}
              </span>
            </div>
            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              {tweet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkedInPreview() {
  const post = `Here's an uncomfortable truth about content creation:

You don't need more ideas. You need a better system for the ideas you already have.

Every episode I record is packed with insights, stories, and frameworks. But for the longest time, those ideas died the moment the episode went live.

Why? Because turning a 30-minute conversation into LinkedIn posts, tweets, and newsletter content felt like a second job.

The shift happened when I stopped treating distribution as a separate task and started treating it as part of the creative process.

Now each episode becomes 15+ pieces of content across platforms. Same ideas, different formats. No extra effort.

What's your biggest bottleneck — creation or distribution?`;

  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-5 pt-4 mb-3">
        <span className="inline-block h-3 w-3 rounded-full bg-platform-linkedin" />
        <span className="text-xs font-semibold text-text-primary">
          LinkedIn Post
        </span>
      </div>
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-bg-elevated" />
          <div>
            <div className="text-xs font-semibold text-text-primary">
              Your Name
            </div>
            <div className="text-xs text-text-muted">
              Creator &middot; Podcaster
            </div>
          </div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-[12]">
          {post}
        </p>
      </div>
      <div className="border-t border-border px-5 py-2 flex items-center gap-6 text-xs text-text-muted">
        <span>Like</span>
        <span>Comment</span>
        <span>Repost</span>
      </div>
    </div>
  );
}

function NewsletterPreview() {
  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-5 pt-4 mb-3">
        <span className="inline-block h-3 w-3 rounded-full bg-platform-newsletter" />
        <span className="text-xs font-semibold text-text-primary">
          Newsletter Draft
        </span>
      </div>
      <div className="bg-bg-elevated px-5 py-3 border-y border-border/50 text-xs">
        <div className="text-text-muted">Subject:</div>
        <div className="font-medium text-text-primary mt-0.5">
          The system behind 200 episodes (and what I&apos;d change)
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          This week on the podcast, I shared something I&apos;ve been thinking about
          for months: why most creators burn out — and it&apos;s not because they
          run out of ideas.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed mt-3">
          The core insight: consistency isn&apos;t about willpower. It&apos;s about
          removing friction from your workflow until publishing becomes the path
          of least resistance.
        </p>
        <div className="mt-3 border-l-2 border-brand/30 pl-3">
          <p className="text-xs text-text-primary italic">
            &ldquo;If it takes more than 10 minutes to turn an episode into
            social content, the process is broken. Not the content. The
            process.&rdquo;
          </p>
        </div>
        <div className="mt-4 text-xs text-text-secondary">
          <p className="font-medium text-text-primary mb-1">Key takeaways:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Batch creation and distribution in one session</li>
            <li>Build systems that scale with your output</li>
            <li>Distribution is part of creation, not a separate job</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function BlogPreview() {
  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-5 pt-4 mb-3">
        <span className="inline-block h-3 w-3 rounded-full bg-platform-blog" />
        <span className="text-xs font-semibold text-text-primary">
          Blog Post
        </span>
        <span className="text-xs text-text-muted font-mono ml-auto">
          ~4 min read
        </span>
      </div>
      <div className="px-5 pb-5">
        <h3 className="text-base font-semibold text-text-primary leading-snug">
          The System Behind 200 Podcast Episodes: Why Consistency Is About
          Process, Not Discipline
        </h3>
        <p className="mt-3 text-xs text-text-secondary leading-relaxed">
          After publishing 200 episodes, the single biggest lesson isn&apos;t
          about content quality, audience growth, or monetization. It&apos;s about
          the invisible systems that make showing up sustainable.
        </p>
        <p className="mt-2 text-xs text-text-secondary leading-relaxed">
          Most creators approach podcasting like a series of isolated events:
          record, edit, publish, promote. Each step feels like a separate job,
          and promotion is always the first thing to get cut when time runs
          short...
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-mono text-text-muted">~850 words</span>
          <span className="text-xs text-text-muted">&middot;</span>
          <span className="text-xs text-text-muted">SEO-optimized</span>
        </div>
      </div>
    </div>
  );
}
