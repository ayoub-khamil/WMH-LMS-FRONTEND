import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Select } from '../common/Select';
import { QuizQuestionEditor } from './QuizQuestionEditor';
import { IconVideo, IconDocumentText, IconQuestionMarkCircle, IconAudio, IconArrowLeft } from '../common/Icons';
import { reportError } from '../../services/logger';

export function ItemEditor({ item, onBack, onSaveSuccess }) {
  const [title, setTitle] = useState(item.title || '');
  const [type, setType] = useState(item.type || 'video');
  const [contentUrl, setContentUrl] = useState(item.content_url || '');
  const [textContent, setTextContent] = useState(item.text_content || '');
  const [questions, setQuestions] = useState(item.questions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Helper to extract YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
    } catch {
      return null;
    }
  };

  const embedUrl = getYouTubeEmbedUrl(contentUrl);

  const refreshQuestions = async () => {
    try {
      if (!item.course_id) return;
      const course = await api.courses.getById(item.course_id);
      for (const s of course.sections || []) {
        const found = (s.items || []).find(i => i.id === item.id);
        if (found) {
          setQuestions(found.questions || []);
          break;
        }
      }
    } catch (e) {
      reportError(e);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.courses.updateItem(item.id, {
        title: title.trim(),
        type,
        content_url: contentUrl.trim(),
        text_content: textContent
      });
      onSaveSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <IconArrowLeft className="w-4 h-4" />
            <span>Back to Curriculum</span>
          </Button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Edit Learning Item: {item.title}
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={handleSaveItem} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Item Settings */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flat-card p-4 space-y-4">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Item Configuration
            </h4>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Content Type
              </label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={[
                  { value: 'video', label: 'Video (Unlisted YouTube)' },
                  { value: 'text', label: 'Text Document / Guide' },
                  { value: 'quiz', label: 'Assessment / Quiz' },
                  { value: 'audio', label: 'Audio Track' }
                ]}
                className="w-full"
              />
            </div>

            {/* Type Specific Fields */}
            {(type === 'video' || type === 'audio') && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  YouTube Content URL *
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Supports standard and unlisted YouTube links.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Content Body or Quiz Editor */}
        <div className="lg:col-span-2 space-y-4">
          {type === 'video' && (
            <div className="flat-card p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Video Embed Preview
              </h4>
              {embedUrl ? (
                <div className="aspect-video w-full rounded border border-zinc-200 dark:border-zinc-800 bg-black overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title="Video Player"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded bg-[#F7F8ED] dark:bg-zinc-900/50 text-xs text-zinc-400">
                  Enter a valid YouTube URL on the left to preview the video player embed.
                </div>
              )}
            </div>
          )}

          {type === 'text' && (
            <div className="flat-card p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Text Content
              </h4>
              <textarea
                rows={12}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste or type plain text here. What you type is exactly what agents see."
                className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-sans leading-relaxed whitespace-pre-wrap font-medium"
              />
            </div>
          )}

          {type === 'quiz' && (
            <div className="flat-card p-4">
              <QuizQuestionEditor
                itemId={item.id}
                questions={questions}
                onQuestionsUpdated={refreshQuestions}
              />
            </div>
          )}

          {type === 'audio' && (
            <div className="flat-card p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Audio Stream Preview
              </h4>
              {embedUrl ? (
                <div className="h-40 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-900 overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title="Audio Player"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded bg-[#F7F8ED] dark:bg-zinc-900/50 text-xs text-zinc-400">
                  Enter an audio stream URL to preview.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
