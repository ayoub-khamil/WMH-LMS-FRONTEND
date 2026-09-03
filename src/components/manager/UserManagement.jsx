import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useListQuery } from '../../useListQuery';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { IconPlus, IconSearch, IconUsers, IconTrash, IconPencil, IconLayers, IconEye, IconEyeSlash } from '../common/Icons';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search, status: statusFilter, role: roleFilter, page, patch } = useListQuery();
  const [totalPages, setTotalPages] = useState(1);

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('agent');
  const [submitting, setSubmitting] = useState(false);
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete User Modal
  const [userToDelete, setUserToDelete] = useState(null);

  // View User Assignments Modal
  const [userAssignmentsModal, setUserAssignmentsModal] = useState(null);
  const [userAssignments, setUserAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.users.list({
        role: roleFilter,
        status: statusFilter,
        search,
        page,
        limit: 10
      });
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, roleFilter, page]);

  useEffect(() => {
    if (!emailManuallyEdited) {
      const fn = firstName.trim().toLowerCase();
      const ln = lastName.trim().toLowerCase();
      if (fn && ln) {
        setEmail(`${fn}.${ln}@watermelon-hub.com`);
      } else if (fn) {
        setEmail(`${fn}@watermelon-hub.com`);
      } else if (ln) {
        setEmail(`${ln}@watermelon-hub.com`);
      } else {
        setEmail('');
      }
    }
  }, [firstName, lastName, emailManuallyEdited]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.users.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        role
      });
      setIsCreateModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRole('agent');
      setEmailManuallyEdited(false);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        role: editingUser.role
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      await api.users.update(editingUser.id, payload);
      setEditingUser(null);
      setEditPassword('');
      setShowEditPassword(false);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      setError('');
      await api.users.updateStatus(user.id, newStatus);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setError('');
      await api.users.delete(userToDelete.id);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleOpenAssignments = async (user) => {
    setUserAssignmentsModal(user);
    setLoadingAssignments(true);
    try {
      const assignments = await api.users.getAssignments(user.id);
      setUserAssignments(assignments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
          {error}
        </div>
      )}
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        <div className="flex items-start space-x-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-80 sm:flex-initial self-start flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                patch({ q: e.target.value, page: 1 }, { replace: true });
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          <Select
            value={roleFilter}
            onChange={(e) => {
              patch({ role: e.target.value, page: 1 });
            }}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'agent', label: 'Agent' },
              { value: 'manager', label: 'Manager' }
            ]}
            className="w-32 flex-shrink-0"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              patch({ status: e.target.value, page: 1 });
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' }
            ]}
            className="w-36 flex-shrink-0"
          />
        </div>

        <Button
          variant="primary"
          className="self-start flex-shrink-0 whitespace-nowrap"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <IconPlus className="w-4 h-4" />
          <span>Add New User</span>
        </Button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-base font-medium">Loading user directory...</div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={IconUsers}
          title="No users found"
          description={search ? "No users matched your search criteria." : "Create frontline agents or managers to begin provisioning training."}
          action={
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <IconPlus className="w-4 h-4" />
              <span>Add First User</span>
            </Button>
          }
        />
      ) : (
        <div className="flat-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge 
                      variant={u.role === 'manager' ? 'role_manager' : 'role_agent'}
                      className="w-20 justify-center text-center font-bold tabular-nums"
                    >
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      title={u.is_root ? 'The root account cannot be modified' : 'Click to toggle active / disabled status'}
                      disabled={u.is_root}
                      className={u.is_root ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    >
                      <Badge variant={u.status === 'active' ? 'active' : 'disabled'} className="w-24 justify-center text-xs tabular-nums">
                        {u.status.toUpperCase()}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 text-xs font-medium whitespace-nowrap">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {u.role === 'agent' && (
                        <button
                          onClick={() => handleOpenAssignments(u)}
                          title="View Assigned Courses"
                          className="p-1.5 text-zinc-500 hover:text-watermelon-green-700 dark:hover:text-watermelon-green-300 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                        >
                          <IconLayers className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditPassword('');
                          setShowEditPassword(false);
                        }}
                        title={u.is_root ? 'The root account cannot be modified' : 'Edit User Details'}
                        disabled={u.is_root}
                        className={`p-1.5 rounded border border-transparent ${u.is_root ? 'text-zinc-300 dark:text-zinc-700 opacity-40 cursor-not-allowed' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-200 dark:hover:border-zinc-800'}`}
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUserToDelete(u)}
                        title={u.is_root ? 'The root account cannot be modified' : 'Delete User'}
                        disabled={u.is_root}
                        className={`p-1.5 rounded border border-zinc-200 dark:border-zinc-800 ${u.is_root ? 'text-zinc-300 dark:text-zinc-700 opacity-40 cursor-not-allowed' : 'text-watermelon-red-500 hover:text-watermelon-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors'}`}
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => patch({ page: page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => patch({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="firstname.lastname@watermelon-hub.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailManuallyEdited(true);
              }}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Initial Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Leave empty for auto-generated password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeSlash className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              System Role
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'agent', label: 'Agent' },
                { value: 'manager', label: 'Training Manager' }
              ]}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => {
              setIsCreateModalOpen(false);
              setFirstName('');
              setLastName('');
              setEmail('');
              setPassword('');
              setShowPassword(false);
              setRole('agent');
              setEmailManuallyEdited(false);
            }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User Profile"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={editingUser?.first_name || ''}
                onChange={(e) => setEditingUser(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={editingUser?.last_name || ''}
                onChange={(e) => setEditingUser(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={editingUser?.email || ''}
              onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
            />
          </div>

          {/* Passwords are never returned by the API and cannot be displayed. */}

          {/* Change Password Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Change Password
            </label>
            <div className="relative">
              <input
                type={showEditPassword ? 'text' : 'password'}
                placeholder="Enter new password (leave empty to keep current)"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 text-sm bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title={showEditPassword ? "Hide password" : "Show password"}
              >
                {showEditPassword ? <IconEyeSlash className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Dropdown - lowest in Edit User Profile */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <Select
              value={editingUser?.role || 'agent'}
              onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
              options={[
                { value: 'agent', label: 'Agent' },
                { value: 'manager', label: 'Training Manager' }
              ]}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? This action cascades and removes all agent assignments and completion records.
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* View User Assignments Modal */}
      <Modal
        isOpen={!!userAssignmentsModal}
        onClose={() => setUserAssignmentsModal(null)}
        title={`Course Assignments for ${userAssignmentsModal?.name}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {loadingAssignments ? (
            <div className="py-6 text-center text-xs text-zinc-400">Loading assignments...</div>
          ) : userAssignments.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400">No courses assigned to this agent yet.</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {userAssignments.map((a, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {a.course_title}
                    </h5>
                    <span className="text-xs text-zinc-400 tabular-nums">
                      Completed: {a.completed_item_ids?.length || 0} / {a.total_items} items
                    </span>
                  </div>
                  <Badge variant={a.status === 'completed' ? 'completed' : 'in_progress'}>
                    {a.status.toUpperCase()} ({a.progress}%)
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setUserAssignmentsModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
