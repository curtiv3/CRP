import { UploadForm } from "@/components/episodes/upload-form";

export const metadata = {
  title: "Upload Episode — ContentRepurpose",
};

export default function NewEpisodePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">
        Upload Episode
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Upload an audio or video file, or paste a YouTube URL. We'll transcribe
        it and generate content for you.
      </p>
      <UploadForm />
    </div>
  );
}
