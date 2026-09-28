import React, { useState, useEffect } from 'react';
import { ErrorBanner } from '../common/ErrorBanner';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Select } from '../common/Select';
import { QuizQuestionEditor } from './QuizQuestionEditor';
import { RichTextEditor } from './RichTextEditor';
import { CARD, CARD_TITLE, LABEL, HINT, INPUT, SELECT_BUTTON, PLACEHOLDER } from './formStyles';
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
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <ErrorBanner error={error} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Item Settings */}
        <div className={`lg:col-span-1 ${CARD}`}>
          <h4 className={CARD_TITLE}>Item Configuration</h4>

          <div>
            <label htmlFor="item-title" className={LABEL}>Item Title *</label>
            <input
              id="item-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <span className={LABEL}>Content Type</span>
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
              buttonClassName={SELECT_BUTTON}
            />
          </div>

          {/* Type Specific Fields */}
          {(type === 'video' || type === 'audio') && (
            <div>
              <label htmlFor="item-url" className={LABEL}>YouTube Content URL *</label>
              <input
                id="item-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className={INPUT}
              />
              <p className={HINT}>Supports standard and unlisted YouTube links.</p>
            </div>
          )}
        </div>

        {/* Right Column: Content Body or Quiz Editor */}
        <div className={`lg:col-span-2 ${CARD}`}>
          {type === 'video' && (
            <>
              <h4 className={CARD_TITLE}>Video Embed Preview</h4>
              {embedUrl ? (
                <div className="aspect-video w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-black overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title="Video Player"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={`aspect-video ${PLACEHOLDER}`}>
                  Enter a valid YouTube URL on the left to preview the video player embed.
                </div>
              )}
            </>
          )}

          {type === 'text' && (
            <>
              <div className={CARD_TITLE}>
                <h4>Text Content</h4>
                <p className="mt-1 text-[11px] font-medium normal-case tracking-normal text-zinc-500 dark:text-zinc-400">
                  Paste straight from Word, Google Docs or a PDF. Headings, lists, tables and links are kept; fonts, colours and images are dropped.
                </p>
              </div>
              <RichTextEditor value={textContent} onChange={setTextContent} />
            </>
          )}

          {type === 'quiz' && (
            <QuizQuestionEditor
              itemId={item.id}
              questions={questions}
              onQuestionsUpdated={refreshQuestions}
            />
          )}

          {type === 'audio' && (
            <>
              <h4 className={CARD_TITLE}>Audio Stream Preview</h4>
              {embedUrl ? (
                <div className="h-40 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-900 overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title="Audio Player"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={`h-32 ${PLACEHOLDER}`}>
                  Enter an audio stream URL on the left to preview.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
