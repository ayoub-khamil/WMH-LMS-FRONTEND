import React from 'react';

export function YouTubePlayer({ url, title }) {
  const getEmbedUrl = (rawUrl) => {
    if (!rawUrl) return null;
    try {
      const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
    } catch {
      return null;
    }
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-8 text-center text-sm text-zinc-500">
        No valid video stream URL configured for this module.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-3">
      <div className="aspect-video w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-black overflow-hidden">
        <iframe
          src={embedUrl}
          title={title || 'Course Lecture Video'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
