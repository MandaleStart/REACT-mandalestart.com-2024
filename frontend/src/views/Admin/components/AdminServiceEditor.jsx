/* eslint-disable react/prop-types */
export default function AdminServiceEditor({
  selectedSlug,
  service,
  setService,
  isDirty,
  busy,
  sessionExpired,
  onSubmit,
  onArchive,
}) {
  const updateField = (field) => (event) => {
    setService((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <form className="admin-form-panel" onSubmit={onSubmit}>
      <div className="admin-panel-heading">
        <h2>{selectedSlug ? 'Editar servicio público' : 'Seleccioná un servicio'}</h2>
        {selectedSlug && service.status !== 'archived' && (
          <button
            type="button"
            className="admin-danger-button"
            onClick={onArchive}
            disabled={busy || sessionExpired}
          >
            Archivar
          </button>
        )}
      </div>
      {isDirty && (
        <p className="admin-feedback warning" role="status">
          Hay cambios sin guardar.
        </p>
      )}
      {!selectedSlug && (
        <p className="admin-panel-help">
          Elegí un slug estático de la lista. Para agregar un nuevo slug es necesario actualizar las
          rutas y desplegar nuevamente el frontend.
        </p>
      )}
      <div className="admin-form-grid">
        <label>
          URL (slug)
          <input
            value={service.slug}
            onChange={updateField('slug')}
            readOnly={Boolean(selectedSlug)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength="80"
            required
          />
        </label>
        <label>
          Título
          <input value={service.title} onChange={updateField('title')} maxLength="140" required />
        </label>
        <label>
          Categoría
          <input
            value={service.category}
            onChange={updateField('category')}
            maxLength="100"
            required
          />
        </label>
        <label>
          Precio visible
          <input value={service.price} onChange={updateField('price')} maxLength="120" />
        </label>
        <label>
          Icono
          <input value={service.icon} onChange={updateField('icon')} maxLength="30" />
        </label>
        <label>
          Acento visual
          <input value={service.accent} onChange={updateField('accent')} maxLength="40" />
        </label>
        <label>
          Visibilidad
          <select value={service.status} onChange={updateField('status')}>
            <option value="active">Visible</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
        <label className="admin-wide-field">
          Descripción
          <textarea
            value={service.description}
            onChange={updateField('description')}
            maxLength="1000"
            rows="3"
            required
          />
        </label>
        <label className="admin-wide-field">
          Resumen
          <textarea
            value={service.summary}
            onChange={updateField('summary')}
            maxLength="500"
            rows="2"
          />
        </label>
        <label className="admin-wide-field">
          Resultado esperado
          <textarea
            value={service.outcome}
            onChange={updateField('outcome')}
            maxLength="1000"
            rows="2"
          />
        </label>
        <label className="admin-wide-field">
          Puntos destacados (uno por línea)
          <textarea
            value={service.pointsText ?? service.points.join('\n')}
            onChange={updateField('pointsText')}
            rows="3"
          />
        </label>
        <label className="admin-wide-field">
          Qué incluye (uno por línea)
          <textarea
            value={service.includesText ?? service.includes.join('\n')}
            onChange={updateField('includesText')}
            rows="3"
          />
        </label>
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="primary-button" disabled={busy || sessionExpired}>
          {busy ? 'Guardando…' : 'Guardar servicio'}
        </button>
      </div>
    </form>
  );
}
