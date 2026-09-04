import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useListQuery } from '../../useListQuery';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Select } from '../common/Select';
import { IconPlus, IconSearch, IconUsers, IconTrash, IconPencil, IconLayers, IconEye, IconEyeSlash, IconCopy, IconCheck } from '../common/Icons';
import { reportError } from '../../services/logger';

const MIN_PASSWORD_LENGTH = 8;

// Fields sit on their own surface with a hairline border. The modal panel is
// #F7F8ED / zinc-900, so a field that reuses those reads as flat text - which
// is why the form looked like one undivided block.
const FIELD_CLASS =
  'w-full px-4 py-2.5 text-sm rounded-lg font-medium transition-colors '
  + 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 '
  + 'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 '
  // index.css bans box-shadow globally, and Tailwind implements ring-* AS a
  // box-shadow - so a ring-based focus style renders nothing. Outline is not
  // affected by that rule, so the focus state actually shows.
  + 'focus:border-watermelon-green-500 focus:outline focus:outline-2 focus:outline-watermelon-green-400';

const SECTION_LABEL_CLASS =
  'text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500';

const FIELD_LABEL_CLASS =
  'block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5';

function describePasswordPair(password, confirmation, { required }) {
  const value = password.trim();
  if (!value) {
    return required
      ? { valid: false, text: 'A password is required.', tone: 'text-zinc-500' }
      : { valid: true, text: '', tone: 'text-zinc-500' };
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      text: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
      tone: 'text-zinc-500'
    };
  }
  if (!confirmation) {
    return { valid: false, text: 'Re-enter the password to confirm.', tone: 'text-zinc-500' };
  }
  if (value !== confirmation.trim()) {
    return {
      valid: false,
      text: 'The two passwords do not match.',
      tone: 'text-watermelon-red-600 dark:text-watermelon-red-400'
    };
  }
  return {
    valid: true,
    text: 'Passwords match.',
    tone: 'text-watermelon-green-700 dark:text-watermelon-green-400'
  };
}

/**
 * Password entry for both the create and edit forms.
 *
 * The manager always chooses the password themselves - it is typed twice and
 * must match before the form will submit. A stored password can never be read
 * back (only a one-way hash of it is kept), so the reveal and copy controls
 * exist to pass the value on while it is still on screen.
 */
function PasswordFields({
  label,
  required,
  password,
  confirmation,
  onPasswordChange,
  onConfirmationChange,
  helpText
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = describePasswordPair(password, confirmation, { required });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the value is on screen either way.
      setRevealed(true);
    }
  };

  return (
    <div>
      <label className={FIELD_LABEL_CLASS}>
        {label}
        {required
          ? ' *'
          : <span className="text-zinc-400 normal-case tracking-normal font-medium"> (optional)</span>}
      </label>

      <div className="relative">
        <input
          type={revealed ? 'text' : 'password'}
          required={required}
          autoComplete="new-password"
          placeholder={required ? 'Choose a password' : 'Leave empty to keep the current password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className={`${FIELD_CLASS} pr-11`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            title={revealed ? 'Hide password' : 'Show password'}
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? <IconEyeSlash className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {password && (
        <div className="relative mt-2.5">
          <input
            type={revealed ? 'text' : 'password'}
            required={required}
            autoComplete="new-password"
            placeholder="Confirm the password"
            aria-label="Confirm the password"
            value={confirmation}
            onChange={(e) => onConfirmationChange(e.target.value)}
            className={`${FIELD_CLASS} pr-11`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleCopy}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              title={copied ? 'Copied' : 'Copy password'}
              aria-label={copied ? 'Copied' : 'Copy password'}
            >
              {copied
                ? <IconCheck className="w-4 h-4 text-watermelon-green-600" />
                : <IconCopy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {(status.text || helpText) && (
        <p className={`mt-1.5 text-xs font-medium ${status.text ? status.tone : 'text-zinc-500'}`}>
          {status.text || helpText}
        </p>
      )}
    </div>
  );
}

// Errors raised by a modal have to render inside that modal. The page-level
// banner sits behind the backdrop, so a failed save looked like nothing at all.
function FormError({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="p-3 rounded-lg border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold"
    >
      {message}
    </div>
  );
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const isRootAccount = Boolean(currentUser?.is_root);

  // Mirrors the server rules so the console never offers an action that is
  // going to come back as a 403: the root account is untouchable, only root
  // administers managers, and nobody may disable or delete themselves.
  const blockedReason = (u, { selfAllowed = false } = {}) => {
    if (u.is_root) return 'The root account cannot be modified';
    if (u.role === 'manager' && !isRootAccount) return 'Only the root account can administer managers';
    if (!selfAllowed && currentUser && u.id === currentUser.id) return 'You cannot do this to your own account';
    return '';
  };

  const roleOptions = isRootAccount
    ? [{ value: 'agent', label: 'Agent' }, { value: 'manager', label: 'Training Manager' }]
    : [{ value: 'agent', label: 'Agent' }];

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
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState('agent');
  const [submitting, setSubmitting] = useState(false);
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  // Snapshot of the row as it was opened, so the header can still say who is
  // being edited after the name or email fields have been changed.
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');

  // Delete User Modal
  const [userToDelete, setUserToDelete] = useState(null);

  // View User Assignments Modal
  const [userAssignmentsModal, setUserAssignmentsModal] = useState(null);
  const [userAssignments, setUserAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  // Page-level error (list load, row actions). Modal failures must never use
  // this: the banner renders behind the modal backdrop where nobody sees it.
  const [error, setError] = useState('');
  // Error shown inside whichever modal is open.
  const [formError, setFormError] = useState('');

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormError('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setRole('agent');
    setEmailManuallyEdited(false);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditingOriginal(null);
    setEditPassword('');
    setEditPasswordConfirm('');
    setFormError('');
  };

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
      reportError(err);
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

    // Every account is created with a password its owner can actually be told.
    // The old "leave empty" path hashed a random value nobody ever saw, which
    // produced an account that could never sign in.
    if (!createPasswordStatus.valid) {
      setFormError(createPasswordStatus.text || 'Choose a password for this account.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api.users.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        role
      });
      closeCreateModal();
      await fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create requires a password; edit treats an empty field as "leave it alone".
  const createPasswordStatus = describePasswordPair(password, passwordConfirm, { required: true });
  const editPasswordStatus = describePasswordPair(editPassword, editPasswordConfirm, { required: false });
  const canSaveEdit = editPasswordStatus.valid;

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // A mistyped password locks the account out and there is no reset flow,
    // so confirm it before sending.
    const newPassword = editPassword.trim();
    if (!editPasswordStatus.valid) {
      setFormError(editPasswordStatus.text || 'Check the password fields.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        role: editingUser.role
      };
      if (newPassword) {
        payload.password = newPassword;
      }
      await api.users.update(editingUser.id, payload);
      closeEditModal();
      await fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
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
      setFormError('');
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
      reportError(err);
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
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F8ED] dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 font-medium"
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
            <Button variant="primary" onClick={() => { setFormError(''); setIsCreateModalOpen(true); }}>
              <IconPlus className="w-4 h-4" />
              <span>Add First User</span>
            </Button>
          }
        />
      ) : (
        <div className="flat-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-[#F7F8ED] dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {users.map((u) => {
                const statusBlocked = blockedReason(u);
                const editBlocked = blockedReason(u, { selfAllowed: true });
                const deleteBlocked = blockedReason(u);
                return (
                <tr key={u.id} className="hover:bg-[#F7F8ED]/60 dark:hover:bg-zinc-900/40 transition-colors">
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
                      title={statusBlocked || 'Click to toggle active / disabled status'}
                      disabled={Boolean(statusBlocked)}
                      className={statusBlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
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
                          setEditingOriginal(u);
                          setEditPassword('');
                          setEditPasswordConfirm('');
                          setFormError('');
                        }}
                        title={editBlocked || 'Edit User Details'}
                        disabled={Boolean(editBlocked)}
                        className={`p-1.5 rounded border border-transparent ${editBlocked ? 'text-zinc-300 dark:text-zinc-700 opacity-40 cursor-not-allowed' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-200 dark:hover:border-zinc-800'}`}
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setFormError(''); setUserToDelete(u); }}
                        title={deleteBlocked || 'Delete User'}
                        disabled={Boolean(deleteBlocked)}
                        className={`p-1.5 rounded border border-zinc-200 dark:border-zinc-800 ${deleteBlocked ? 'text-zinc-300 dark:text-zinc-700 opacity-40 cursor-not-allowed' : 'text-watermelon-red-500 hover:text-watermelon-red-600 hover:bg-[#F7F8ED] dark:hover:bg-zinc-900 transition-colors'}`}
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
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
        onClose={closeCreateModal}
        title="Add New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <FormError message={formError} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD_LABEL_CLASS}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={FIELD_LABEL_CLASS}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL_CLASS}>
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
              className={FIELD_CLASS}
            />
          </div>

          <PasswordFields
            label="Initial Password"
            required
            password={password}
            confirmation={passwordConfirm}
            onPasswordChange={setPassword}
            onConfirmationChange={setPasswordConfirm}
            helpText={`At least ${MIN_PASSWORD_LENGTH} characters. Note it down and pass it on - it cannot be read back later.`}
          />

          <div>
            <label className={FIELD_LABEL_CLASS}>
              System Role
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roleOptions}
              className="w-full"
              buttonClassName={FIELD_CLASS}
            />
            {!isRootAccount && (
              <p className="mt-1.5 text-xs font-medium text-zinc-500">
                Only the root account can create Training Managers.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !createPasswordStatus.valid}>
              {submitting ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={closeEditModal}
        title="Edit User Profile"
      >
        <form onSubmit={handleUpdateUser} className="space-y-6">
          <FormError message={formError} />

          {/* ── Profile ── */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <h4 className={SECTION_LABEL_CLASS}>Profile</h4>
              {/* The role of the account being edited - the one fact the fields
                  below do not already show. */}
              <Badge
                variant={editingOriginal?.role === 'manager' ? 'role_manager' : 'role_agent'}
                className="justify-center text-center font-bold"
              >
                {String(editingOriginal?.role || '').toUpperCase()}
              </Badge>
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={FIELD_LABEL_CLASS}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={editingUser?.first_name || ''}
                onChange={(e) => setEditingUser(prev => ({ ...prev, first_name: e.target.value }))}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={FIELD_LABEL_CLASS}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={editingUser?.last_name || ''}
                onChange={(e) => setEditingUser(prev => ({ ...prev, last_name: e.target.value }))}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL_CLASS}>
              Email Address *
            </label>
            <input
              type="email"
              required
              value={editingUser?.email || ''}
              onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
              className={FIELD_CLASS}
            />
            <p className="mt-1.5 text-xs font-medium text-zinc-500">
              This is the address they sign in with.
            </p>
          </div>
          </section>

          {/* ── Access ── */}
          <section className="space-y-3.5 pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className={SECTION_LABEL_CLASS}>Access</h4>

            {/* Passwords are never returned by the API and cannot be displayed. */}
            <PasswordFields
              label="Change Password"
              required={false}
              password={editPassword}
              confirmation={editPasswordConfirm}
              onPasswordChange={setEditPassword}
              onConfirmationChange={setEditPasswordConfirm}
              helpText="The stored password cannot be displayed - only replaced."
            />

            <div>
              <label className={FIELD_LABEL_CLASS}>
                Role
              </label>
              <Select
                value={editingUser?.role || 'agent'}
                onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                options={roleOptions}
                disabled={!isRootAccount}
                className="w-full"
                buttonClassName={FIELD_CLASS}
              />
              {!isRootAccount && (
                <p className="mt-1.5 text-xs font-medium text-zinc-500">
                  Only the root account can change a role.
                </p>
              )}
            </div>
          </section>

          <div className="flex justify-end space-x-3 pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || !canSaveEdit}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => { setUserToDelete(null); setFormError(''); }}
        title="Delete User"
      >
        <div className="space-y-4">
          <FormError message={formError} />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? This action cascades and removes all agent assignments and completion records.
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => { setUserToDelete(null); setFormError(''); }}>
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
                  className="p-3 border border-zinc-200 dark:border-zinc-800 rounded bg-[#F7F8ED]/50 dark:bg-zinc-900/30 flex items-center justify-between"
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
