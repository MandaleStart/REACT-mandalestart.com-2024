/* eslint-disable react/prop-types */
export default function AdminConfirmationDialog({ dialogRef, confirmation, onCancel, onConfirm }) {
  return (
    <dialog
      ref={dialogRef}
      className="admin-confirmation-dialog"
      aria-labelledby="admin-confirmation-title"
      aria-describedby="admin-confirmation-message"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
    >
      <h2 id="admin-confirmation-title">Confirmar acción</h2>
      <p id="admin-confirmation-message">{confirmation?.message}</p>
      <div className="admin-confirmation-actions">
        <button type="button" className="secondary-button" autoFocus onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="admin-danger-button" onClick={onConfirm}>
          {confirmation?.confirmLabel || 'Confirmar'}
        </button>
      </div>
    </dialog>
  );
}
