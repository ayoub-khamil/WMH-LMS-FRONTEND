import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { ItemEditor } from './ItemEditor';
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconPencil,
  IconArrowUp,
  IconArrowDown,
  IconVideo,
  IconDocumentText,
  IconQuestionMarkCircle,
  IconAudio,
  IconBook
} from '../common/Icons';
import { reportError } from '../../services/logger';

function findItemInCourse(course, itemId) {
  if (!course || itemId == null) return null;
  for (const section of course.sections || []) {
    const match = (section.items || []).find(it => it.id === Number(itemId));
    if (match) return { ...match, course_id: course.id };
  }
  return null;
}

export function CourseEditor({
  courseId,
  onBack,
  onManageAssignments,
  editingItemId = null,
  onEditItem,
  onCloseItem
}) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Section Modals & State
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  // Item Modals & State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState('video');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadCourse = async () => {
    try {
      setError('');
      const data = await api.courses.getById(courseId);
      setCourse(data);
    } catch (err) {
      reportError(err);
      setError(err.message || 'Failed to load course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (loading || !course || !editingItemId) return;
    if (!findItemInCourse(course, editingItemId) && onCloseItem) onCloseItem();
  }, [loading, course, editingItemId, onCloseItem]);

  const handleTogglePublish = async () => {
    if (!course) return;
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await api.courses.update(course.id, { status: newStatus });
      setCourse(prev => ({ ...prev, status: updated.status }));
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  // Section Handlers
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    try {
      await api.courses.addSection(course.id, { title: newSectionTitle.trim() });
      setIsAddSectionOpen(false);
      setNewSectionTitle('');
      await loadCourse();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  const handleUpdateSectionTitle = async (e) => {
    e.preventDefault();
    if (!editingSection || !editingSection.title.trim()) return;
    try {
      await api.courses.updateSection(editingSection.id, { title: editingSection.title.trim() });
      setEditingSection(null);
      await loadCourse();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  const handleDeleteSection = (sectionId) => {
    const section = (course.sections || []).find(s => s.id === sectionId);
    setSectionToDelete(section || null);
  };

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      await api.courses.deleteSection(sectionToDelete.id);
      setSectionToDelete(null);
      await loadCourse();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  const handleMoveSection = async (index, direction) => {
    const sections = [...(course.sections || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    // Swap
    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

    const section_ids = sections.map(s => s.id);
    try {
      await api.courses.reorderSections(course.id, section_ids);
      await loadCourse();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  // Item Handlers
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !targetSectionId) return;
    try {
      const created = await api.courses.addItem(targetSectionId, {
        title: newItemTitle.trim(),
        type: newItemType,
        content_url: newItemUrl.trim()
      });
      setIsAddItemOpen(false);
      setNewItemTitle('');
      setNewItemUrl('');
      await loadCourse();
      if (onEditItem) onEditItem(created.id);
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  const handleDeleteItem = (itemId) => {
    let found = null;
    for (const s of (course.sections || [])) {
      const match = (s.items || []).find(it => it.id === itemId);
      if (match) { found = { ...match, section_title: s.title }; break; }
    }
    setItemToDelete(found);
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await api.courses.deleteItem(itemToDelete.id);
      const deletedId = itemToDelete.id;
      setItemToDelete(null);
      await loadCourse();
      if (Number(editingItemId) === Number(deletedId) && onCloseItem) onCloseItem();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  const handleMoveItem = async (sectionId, itemIdx, direction) => {
    const section = (course.sections || []).find(s => s.id === sectionId);
    if (!section || !section.items) return;

    const items = [...section.items];
    const targetIdx = itemIdx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    // Swap
    const temp = items[itemIdx];
    items[itemIdx] = items[targetIdx];
    items[targetIdx] = temp;

    const item_ids = items.map(i => i.id);
    try {
      await api.courses.reorderItems(sectionId, item_ids);
      await loadCourse();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-zinc-400 text-base font-medium">Loading course tree...</div>;
  }

  if (!course) {
    return (
      <EmptyState
        icon={IconBook}
        title="Course not found"
        description="The requested course could not be loaded."
        action={<Button variant="secondary" onClick={onBack}>Return to Catalog</Button>}
      />
    );
  }

  const activeEditingItem = findItemInCourse(course, editingItemId);

  if (editingItemId && !activeEditingItem) {
    return <div className="py-24 text-center text-zinc-400 text-base font-medium">Loading course tree...</div>;
  }

  if (activeEditingItem) {
    return (
      <ItemEditor
        key={activeEditingItem.id}
        item={activeEditingItem}
        onBack={() => {
          if (onCloseItem) onCloseItem();
          loadCourse();
        }}
        onSaveSuccess={() => {
          if (onCloseItem) onCloseItem();
          loadCourse();
        }}
      />
    );
  }

  const getItemIcon = (type) => {
    switch (type) {
      case 'video': return IconVideo;
      case 'text': return IconDocumentText;
      case 'quiz': return IconQuestionMarkCircle;
      case 'audio': return IconAudio;
      default: return IconDocumentText;
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
          {error}
        </div>
      )}
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <IconArrowLeft className="w-4 h-4" />
            <span>Catalog</span>
          </Button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {course.title}
              <Badge variant={course.status === 'published' ? 'published' : 'draft'}>
                {course.status.toUpperCase()}
              </Badge>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onManageAssignments(course.id)}
          >
            Manage Assignments
          </Button>

          <Button
            variant={course.status === 'published' ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleTogglePublish}
          >
            {course.status === 'published' ? 'Unpublish to Draft' : 'Publish Course'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddSectionOpen(true)}
          >
            <IconPlus className="w-4 h-4" />
            <span>Add Section</span>
          </Button>
        </div>
      </div>

      {/* Sections Tree */}
      {(course.sections || []).length === 0 ? (
        <EmptyState
          icon={IconBook}
          title="Curriculum is empty"
          description="Create your first section to begin organizing video lectures, text documents, and quiz assessments."
          action={
            <Button variant="primary" onClick={() => setIsAddSectionOpen(true)}>
              <IconPlus className="w-4 h-4" />
              <span>Create Section</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {course.sections.map((section, sIdx) => {
            const items = section.items || [];
            return (
              <div
                key={section.id}
                className="border-2 border-wmh-green rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-5 py-3.5 bg-[#F7F8ED] dark:bg-zinc-900/60 border-b border-wmh-green flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      SECTION {sIdx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {section.title}
                    </h3>
                    <span className="text-xs text-zinc-400">
                      ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Section Reorder Buttons */}
                    <button
                      disabled={sIdx === 0}
                      onClick={() => handleMoveSection(sIdx, -1)}
                      title="Move Section Up"
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 rounded"
                    >
                      <IconArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={sIdx === course.sections.length - 1}
                      onClick={() => handleMoveSection(sIdx, 1)}
                      title="Move Section Down"
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 rounded"
                    >
                      <IconArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setEditingSection(section)}
                      title="Rename Section"
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
                    >
                      <IconPencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      title="Delete Section"
                      className="p-1.5 text-rose-500 hover:text-rose-600 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-[#F7F8ED] dark:hover:bg-zinc-900 transition-colors"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setTargetSectionId(section.id);
                        setIsAddItemOpen(true);
                      }}
                      className="ml-2 py-1 text-xs"
                    >
                      <IconPlus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </Button>
                  </div>
                </div>

                {/* Section Items */}
                <div className="p-4">
                  {items.length === 0 ? (
                    <EmptyState
                      icon={IconBook}
                      title="No learning items yet"
                      description="Add videos, SOP guides, or quizzes to build this module section."
                    />
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, iIdx) => {
                        const ItemIcon = getItemIcon(item.type);
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-[#F7F8ED] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {item.title}
                                </span>
                                <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                                  <span className="capitalize">{item.type}</span>
                                  {item.type === 'quiz' && (
                                    <span>• {item.questions?.length || 0} Questions</span>
                                  )}
                                  {item.content_url && (
                                    <span className="truncate max-w-xs">• {item.content_url}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {/* Item Reordering */}
                              <button
                                disabled={iIdx === 0}
                                onClick={() => handleMoveItem(section.id, iIdx, -1)}
                                title="Move Item Up"
                                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                              >
                                <IconArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={iIdx === items.length - 1}
                                onClick={() => handleMoveItem(section.id, iIdx, 1)}
                                title="Move Item Down"
                                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                              >
                                <IconArrowDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onEditItem && onEditItem(item.id)}
                                title="Edit Item"
                                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded border border-zinc-200 dark:border-zinc-700"
                              >
                                <IconPencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete Item"
                                className="p-1.5 text-rose-500 hover:text-rose-600 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-[#F7F8ED] dark:hover:bg-zinc-900 transition-colors"
                              >
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Section Modal */}
      <Modal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
        title="Add Curriculum Section"
      >
        <form onSubmit={handleAddSection} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Section Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Module 2: Escalation & Compliance"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setIsAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Section
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        title="Rename Section"
      >
        <form onSubmit={handleUpdateSectionTitle} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Section Title *
            </label>
            <input
              type="text"
              required
              value={editingSection?.title || ''}
              onChange={(e) => setEditingSection(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add Learning Node"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Item Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Call Etiquette Video Demonstration"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Content Type
            </label>
            <Select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              options={[
                { value: 'video', label: 'Video (Unlisted YouTube)' },
                { value: 'text', label: 'Text Document / SOP Guide' },
                { value: 'quiz', label: 'Assessment Quiz (100% Passing Engine)' },
                { value: 'audio', label: 'Audio Lesson' }
              ]}
              className="w-full"
            />
          </div>

          {(newItemType === 'video' || newItemType === 'audio') && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Section Confirmation Modal */}
      <Modal
        isOpen={!!sectionToDelete}
        onClose={() => setSectionToDelete(null)}
        title="Delete Curriculum Section"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete <strong>{sectionToDelete?.title}</strong>? This will cascade and remove all {sectionToDelete?.items?.length || 0} contained learning item(s) and any recorded agent progress.
          </p>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setSectionToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSection}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Delete Learning Item"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete <strong>{itemToDelete?.title}</strong>{itemToDelete?.section_title && <> from section <strong>{itemToDelete.section_title}</strong></>}? This will remove any associated quiz questions, embedded content, and recorded agent progress.
          </p>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteItem}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
