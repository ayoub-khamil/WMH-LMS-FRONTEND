import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { IconPlus, IconTrash, IconPencil, IconQuestionMarkCircle, IconCheck } from '../common/Icons';

export function QuizQuestionEditor({ itemId, questions = [], onQuestionsUpdated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // Question Form State
  const [type, setType] = useState('multiple_choice'); // multiple_choice, true_false, multiple_answer
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState([
    { id: 1, text: '', is_correct: false },
    { id: 2, text: '', is_correct: false }
  ]);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setType('multiple_choice');
    setPrompt('');
    setOptions([
      { id: Date.now(), text: '', is_correct: true },
      { id: Date.now() + 1, text: '', is_correct: false }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (question) => {
    setEditingQuestion(question);
    setType(question.type || 'multiple_choice');
    setPrompt(question.prompt || '');
    setOptions(question.options?.map(o => ({ ...o })) || []);
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'true_false') {
      setOptions([
        { id: Date.now(), text: 'True', is_correct: true },
        { id: Date.now() + 1, text: 'False', is_correct: false }
      ]);
    } else if (options.length < 2) {
      setOptions([
        { id: Date.now(), text: '', is_correct: true },
        { id: Date.now() + 1, text: '', is_correct: false }
      ]);
    }
  };

  const handleOptionTextChange = (index, text) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const handleOptionCorrectToggle = (index) => {
    const updated = [...options];
    if (type === 'multiple_choice' || type === 'true_false') {
      // Single choice
      updated.forEach((opt, idx) => {
        opt.is_correct = idx === index;
      });
    } else {
      // Multiple answer
      updated[index].is_correct = !updated[index].is_correct;
    }
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([...options, { id: Date.now(), text: '', is_correct: false }]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Validation: At least one correct answer
    const hasCorrect = options.some(o => o.is_correct);
    if (!hasCorrect) {
      alert('Please mark at least one option as the correct answer.');
      return;
    }

    setSaving(true);
    try {
      if (editingQuestion) {
        await api.courses.updateQuestion(editingQuestion.id, {
          type,
          prompt: prompt.trim(),
          options
        });
      } else {
        await api.courses.addQuestion(itemId, {
          type,
          prompt: prompt.trim(),
          options
        });
      }
      setIsModalOpen(false);
      onQuestionsUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = (qId) => {
    setQuestionToDelete(qId);
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await api.courses.deleteQuestion(questionToDelete);
      setQuestionToDelete(null);
      onQuestionsUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Assessment Questions ({questions.length})
          </h4>
          <p className="text-xs text-zinc-500">
            Agents must score 100% on this assessment to complete the module.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={openCreateModal}>
          <IconPlus className="w-3.5 h-3.5" />
          <span>Add Question</span>
        </Button>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={IconQuestionMarkCircle}
          title="No questions created"
          description="Add assessment questions to evaluate agent retention and policy understanding."
          action={
            <Button size="sm" variant="primary" onClick={openCreateModal}>
              <IconPlus className="w-3.5 h-3.5" />
              <span>Create First Question</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    Q{idx + 1}.
                  </span>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {q.prompt}
                  </p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Badge variant="neutral">
                    {q.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                  >
                    <IconPencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1 text-rose-400 hover:text-rose-600 rounded"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Options Preview */}
              <div className="pl-6 space-y-1">
                {q.options?.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2 text-xs">
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        opt.is_correct
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {opt.is_correct && <IconCheck className="w-2.5 h-2.5" />}
                    </span>
                    <span className={opt.is_correct ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}>
                      {opt.text}
                    </span>
                    {opt.is_correct && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        (Correct)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Assessment Question' : 'New Assessment Question'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Question Type
            </label>
            <Select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              options={[
                { value: 'multiple_choice', label: 'Single Choice (Radio)' },
                { value: 'multiple_answer', label: 'Multiple Answer (Checkbox)' },
                { value: 'true_false', label: 'True / False' }
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Question Prompt *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Which of the following customer actions requires an instant Tier 2 escalation?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Answer Options & Correct Answer Key
              </label>
              {type !== 'true_false' && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                >
                  + Add Option
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div key={opt.id || idx} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOptionCorrectToggle(idx)}
                    title="Toggle correct answer"
                    className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                      opt.is_correct
                        ? 'bg-emerald-400 border-emerald-500 text-zinc-950 font-bold'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-transparent'
                    }`}
                  >
                    <IconCheck className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="text"
                    required
                    disabled={type === 'true_false'}
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium disabled:opacity-60"
                  />

                  {type !== 'true_false' && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1 text-zinc-400 hover:text-rose-500"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Click the checkmark icon on the left to set the correct answer(s).
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Question'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Question Confirmation Modal */}
      <Modal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        title="Delete Assessment Question"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete this assessment question? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => setQuestionToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteQuestion}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
