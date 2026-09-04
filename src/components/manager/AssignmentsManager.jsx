import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { paths } from '../../appRoutes';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { IconLayers, IconPlus, IconTrash, IconSearch, IconCheck, IconClock, IconArrowLeftSmall } from '../common/Icons';
import { reportError } from '../../services/logger';

export function AssignmentsManager({ initialCourseId = null }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  const [agentToUnassign, setAgentToUnassign] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoadingDetail(true);
      try {
        const coursesRes = await api.courses.list({ status: 'published', limit: 100 });
        setCourses(coursesRes.data.filter(c => c.status === 'published' || !c.status));

        const usersRes = await api.users.list({ role: 'agent', status: 'active', limit: 100 });
        setAllAgents(usersRes.data);

        if (initialCourseId) {
          const cohortRes = await api.assignments.getCourseAssignments(initialCourseId);
          setAssignments(cohortRes);
          setSelectedCourseId(Number(initialCourseId));
        } else {
          setSelectedCourseId(null);
          setAssignments([]);
        }
      } catch (err) {
        reportError(err);
        setError(err.message || 'Failed to load assignments.');
      } finally {
        setLoadingDetail(false);
      }
    };
    init();
  }, [initialCourseId]);

  const handleBack = () => {
    navigate(paths.managerCourses);
  };

  const handleUnassignAgent = (agentId) => {
    const assignment = assignments.find(a => a.agent_id === agentId);
    setAgentToUnassign(assignment || { agent_id: agentId });
  };

  const handleConfirmUnassign = async () => {
    if (!agentToUnassign) return;
    try {
      setError('');
      await api.assignments.unassignBulk({
        course_id: selectedCourseId,
        agent_ids: [agentToUnassign.agent_id]
      });
      setAgentToUnassign(null);
      const cohortRes = await api.assignments.getCourseAssignments(selectedCourseId);
      setAssignments(cohortRes);
    } catch (err) {
      setError(err.message || 'Failed to unassign agent.');
    }
  };

  const handleToggleSelectAgent = (agentId) => {
    setSelectedAgentIds(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSelectAllAgents = () => {
    const allIds = filteredUnassigned.map(a => a.id);
    setSelectedAgentIds(prev => {
      const allSelected = allIds.length > 0 && allIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !allIds.includes(id));
      }
      return Array.from(new Set([...prev, ...allIds]));
    });
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (selectedAgentIds.length === 0 || !selectedCourseId) return;
    setAssigning(true);
    setError('');
    try {
      await api.assignments.assignBulk({
        course_id: selectedCourseId,
        agent_ids: selectedAgentIds
      });
      setIsAssignModalOpen(false);
      setSelectedAgentIds([]);
      const cohortRes = await api.assignments.getCourseAssignments(selectedCourseId);
      setAssignments(cohortRes);
    } catch (err) {
      setError(err.message || 'Failed to enroll agents.');
    } finally {
      setAssigning(false);
    }
  };

  const currentCourse = courses.find(c => c.id === Number(selectedCourseId));
  const assignedAgentIdSet = new Set(assignments.map(a => a.agent_id));
  const unassignedAgents = allAgents.filter(a => !assignedAgentIdSet.has(a.id));
  const filteredUnassigned = unassignedAgents.filter(a =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(agentSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-wider transition-colors flex-shrink-0"
          >
            <IconArrowLeftSmall className="w-4 h-4" />
            Catalog
          </button>
          <span className="text-zinc-300 dark:text-zinc-700 flex-shrink-0">/</span>
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 truncate">
            {currentCourse?.title || 'Course'}
          </h2>
        </div>

        <Button
          variant="primary"
          size="md"
          className="self-start flex-shrink-0 font-semibold"
          onClick={() => {
            setSelectedAgentIds([]);
            setIsAssignModalOpen(true);
          }}
          disabled={loadingDetail}
        >
          <IconPlus className="w-4 h-4" />
          <span>Enroll Agents</span>
        </Button>
      </div>

      {!loadingDetail && currentCourse && (() => {
        const total = assignments.length;
        const completedCount = assignments.filter(a => a.status === 'completed' || a.progress === 100).length;
        const inProgressCount = total - completedCount;
        const completedPct = total > 0 ? (completedCount / total) * 100 : 0;
        const inProgressPct = total > 0 ? (inProgressCount / total) * 100 : 0;
        return (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F7F8ED] dark:bg-zinc-900 overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-3.5">
              <div className="flex flex-col items-center gap-2 min-w-[90px]">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <IconLayers className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide leading-none">Enrolled</div>
                  <div className="mt-1 flex items-baseline justify-center gap-1 leading-none">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{total}</span>
                    <span className="text-xs text-zinc-400 font-medium">agents</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[90px]">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-md bg-watermelon-green-100 dark:bg-watermelon-green-900/30">
                  <IconCheck className="w-4 h-4 text-watermelon-green-600 dark:text-watermelon-green-400" strokeWidth={3} />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-watermelon-green-700 dark:text-watermelon-green-300 uppercase tracking-wide leading-none">Completed</div>
                  <div className="mt-1 flex items-baseline justify-center gap-1 leading-none">
                    <span className="text-lg font-bold text-watermelon-green-600 dark:text-watermelon-green-400 tabular-nums">{completedCount}</span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {total > 0 ? `(${Math.round(completedPct)}%)` : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[90px]">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <IconClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide leading-none">In Progress</div>
                  <div className="mt-1 flex items-baseline justify-center gap-1 leading-none">
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{inProgressCount}</span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {total > 0 ? `(${Math.round(inProgressPct)}%)` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {loadingDetail ? (
        <div className="py-24 text-center text-zinc-400 text-base font-medium">Loading course enrollments...</div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={IconLayers}
          title="No agents enrolled yet"
          description="Enroll active agents to this course to begin tracking their completion progress."
          action={
            <Button
              variant="primary"
              onClick={() => {
                setSelectedAgentIds([]);
                setIsAssignModalOpen(true);
              }}
            >
              <IconPlus className="w-4 h-4" />
              <span>Enroll Agents</span>
            </Button>
          }
        />
      ) : (
        <div className="flat-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8ED] dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Agent Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Enrolled</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {assignments.map((assignment) => (
                <tr key={assignment.agent_id} className="hover:bg-[#F7F8ED]/60 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                    {assignment.agent_name}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                    {assignment.agent_email || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={assignment.status === 'completed' ? 'completed' : assignment.status === 'in_progress' ? 'in_progress' : 'not_started'}
                      className="w-28 justify-center text-center font-bold tabular-nums"
                    >
                      {assignment.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3 w-48">
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-watermelon-green-400 dark:bg-watermelon-green-500 transition-all duration-300"
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums font-bold text-watermelon-green-700 dark:text-watermelon-green-300 whitespace-nowrap">
                        {assignment.progress}% · {assignment.completed_items_count || 0} of {assignment.total_items || 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                    {assignment.assigned_at
                      ? new Date(assignment.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                    {assignment.completed_at && (
                      <> → {new Date(assignment.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleUnassignAgent(assignment.agent_id)}
                      title="Unassign Agent"
                      className="p-1.5 text-zinc-400 hover:text-watermelon-red-600 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Enroll Agents in "${currentCourse?.title || 'Course'}"`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleBulkAssign} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <IconSearch className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search available agents by name or email..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F7F8ED] dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSelectAllAgents}
              disabled={filteredUnassigned.length === 0}
            >
              {filteredUnassigned.length > 0 && filteredUnassigned.every(a => selectedAgentIds.includes(a.id))
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-60 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredUnassigned.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                {agentSearch ? 'No matching unassigned agents.' : 'All active agents are already enrolled in this course.'}
              </div>
            ) : (
              filteredUnassigned.map((agent) => {
                const isChecked = selectedAgentIds.includes(agent.id);
                return (
                  <div
                    key={agent.id}
                    onClick={() => handleToggleSelectAgent(agent.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-[#F7F8ED] dark:hover:bg-zinc-800/50 transition-colors ${
                      isChecked ? 'bg-watermelon-green-50/60 dark:bg-watermelon-green-950/30' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {agent.name}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {agent.email}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-watermelon-green-400 border-watermelon-green-500 text-zinc-950 font-bold'
                          : 'border-zinc-300 dark:border-zinc-700 bg-[#F7F8ED] dark:bg-zinc-800'
                      }`}
                    >
                      {isChecked && <IconCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 tabular-nums">
              {selectedAgentIds.length} {selectedAgentIds.length === 1 ? 'agent' : 'agents'} selected
            </span>
            <div className="flex space-x-3 pt-3">
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={assigning || selectedAgentIds.length === 0}
              >
                {assigning ? 'Enrolling...' : 'Confirm Enrollment'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!agentToUnassign}
        onClose={() => setAgentToUnassign(null)}
        title="Unassign Agent"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to unassign <strong>{agentToUnassign?.agent_name || 'this agent'}</strong> {agentToUnassign?.agent_email ? `(${agentToUnassign.agent_email})` : ''} from <strong>{currentCourse?.title || 'this course'}</strong>? This will remove the agent's enrollment and any progress records for this course.
          </p>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" onClick={() => setAgentToUnassign(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmUnassign}>
              Confirm Unassign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
