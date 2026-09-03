import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useListQuery } from '../../useListQuery';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { IconPlus, IconSearch, IconBook, IconPencil, IconTrash, IconLayers } from '../common/Icons';

export function CoursesList({ onSelectCourse, onManageAssignments }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search, status: statusFilter, page, patch } = useListQuery();
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [courseToDelete, setCourseToDelete] = useState(null);
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.courses.list({
        status: statusFilter,
        search,
        page,
        limit: 8
      });
      setCourses(res.data);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search, statusFilter, page]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreateSubmitting(true);
    try {
      const created = await api.courses.create({
        title: newTitle.trim(),
        description: newDesc.trim()
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      await fetchCourses();
      onSelectCourse(created.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await api.courses.delete(courseToDelete.id);
      setCourseToDelete(null);
      await fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
          {error}
        </div>
      )}
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        <div className="flex items-start space-x-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-80 self-start">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search curriculum by title..."
              value={search}
              onChange={(e) => {
                patch({ q: e.target.value, page: 1 }, { replace: true });
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => {
              patch({ status: e.target.value, page: 1 });
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' }
            ]}
            className="min-w-[140px]"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          className="whitespace-nowrap px-6"
        >
          <IconPlus className="w-4 h-4" />
          <span>New Course</span>
        </Button>
      </div>

      {/* Course List / Grid */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-base font-medium">
          Loading courses catalog...
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={IconBook}
          title="No courses found"
          description={search ? "No courses matched your query." : "Get started by creating your first training course module."}
          action={
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <IconPlus className="w-4 h-4" />
              <span>Create Course</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4 w-full">
          {courses.map((course) => {
            const sectionsCount = course.sections?.length || 0;
            const itemsCount = (course.sections || []).reduce(
              (acc, s) => acc + (s.items?.length || 0),
              0
            );

            return (
              <div
                key={course.id}
                className={`relative w-full bg-white dark:bg-zinc-900 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${course.status === 'published' ? 'border-2 border-watermelon-green-400' : 'border-2 border-zinc-500'}`}
              >
                {/* Status badge sitting on the top border */}
                <span className="absolute top-0 left-8 -translate-y-1/2">
                  <Badge variant={course.status} className="w-20 justify-center">
                    {course.status.toUpperCase()}
                  </Badge>
                </span>

                {/* Left Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 break-words">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-4xl break-words">
                    {course.description || "No description provided."}
                  </p>

                  <div className="flex items-center space-x-3 text-xs font-mono font-bold text-zinc-400 pt-1">
                    <span>{sectionsCount} {sectionsCount === 1 ? 'Section' : 'Sections'}</span>
                    <span>•</span>
                    <span>{itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}</span>
                    {course.created_at && (
                      <>
                        <span>•</span>
                        <span>Created {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-2.5 flex-shrink-0 self-end md:self-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onManageAssignments(course.id)}
                    title="Manage Cohort Assignments"
                    className="flex items-center gap-1.5 text-xs font-bold"
                  >
                    <IconLayers className="w-4 h-4 text-watermelon-green-600 dark:text-watermelon-green-400" />
                    <span>Assignments</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectCourse(course.id)}
                    title="Edit Course Tree"
                    className="flex items-center gap-1.5 text-xs font-bold"
                  >
                    <IconPencil className="w-4 h-4" />
                    <span>Edit Tree</span>
                  </Button>

                  <button
                    onClick={() => setCourseToDelete(course)}
                    title="Delete Course"
                    className="p-1.5 text-watermelon-red-500 hover:text-watermelon-red-600 hover:bg-watermelon-red-50 dark:hover:bg-watermelon-red-950/40 rounded border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-mono font-bold text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => patch({ page: page - 1 })}
              className="font-bold"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => patch({ page: page + 1 })}
              className="font-bold"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Training Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inbound De-escalation & SLA Protocols"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Description & Learning Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of skills covered in this training..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createSubmitting || !newTitle.trim()}
            >
              {createSubmitting ? 'Creating...' : 'Create & Open Editor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Course Confirmation Modal */}
      <Modal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        title="Delete Course Curriculum"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete <strong>{courseToDelete?.title}</strong>? This will cascade and remove all sections, items, quiz questions, and associated agent progress.
          </p>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setCourseToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
