/* eslint-disable react/prop-types */
export default function AdminServiceList({ services, selectedSlug, onSelect }) {
  return (
    <aside className="admin-list-panel">
      <div className="admin-panel-heading">
        <h2>Catálogo público</h2>
      </div>
      <div className="admin-record-list">
        {services.map((service) => (
          <button
            key={service.slug}
            type="button"
            className={selectedSlug === service.slug ? 'is-selected' : ''}
            onClick={() => onSelect(service.slug)}
          >
            <strong>{service.title || service.slug}</strong>
            <span>
              {service.slug} · {service.status === 'archived' ? 'Archivado' : 'Visible'}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
