/**
 * Event handlers that discourage copying course material and notes out of
 * the app. This is a deterrent, not protection: anything a browser displays
 * can still be captured with screenshots or the developer tools.
 *
 * Keyboard shortcuts (Ctrl+C / Ctrl+X / Ctrl+V) raise the same clipboard
 * events, so cancelling the events covers them too.
 */

const cancel = (e) => e.preventDefault();

/** Read-only content: no copying, dragging text out, or context menu. */
export const readOnlyGuard = {
  onCopy: cancel,
  onCut: cancel,
  onDragStart: cancel,
  onContextMenu: cancel
};

/** Editable fields: typing works, but nothing moves in or out via the clipboard. */
export const editableGuard = {
  ...readOnlyGuard,
  onPaste: cancel,
  onDrop: cancel
};
