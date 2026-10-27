import { useState } from 'react';
import { filterPublicServices } from '../adminModel';

/* eslint-disable react/prop-types */
export default function AdminServiceList({ services, selectedSlug, onSelect }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const filteredServices = filterPublicServices(services, search, status);

  return (
    <aside className="admin-list-panel">
      <div className="admin-panel-heading">
        <h2>Catálogo público</h2>
      </div>
      <label className="admin-client-search admin-service-search">
        Buscar por nombre, categoría o slug
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-controls="admin-service-records"
        />
      </label>
      <div className="admin-service-filters" aria-label="Filtrar servicios por estado">
        {[
          ['all', 'Todos'],
          ['active', 'Visibles'],
          ['archived', 'Archivados'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="admin-search-count" aria-live="polite">
        {filteredServices.length} de {services.length} servicios
      </p>
      <div className="admin-record-list" id="admin-service-records">
        {filteredServices.map((service) => (
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
        {services.length === 0 && <p>No hay servicios en el catálogo.</p>}
        {services.length > 0 && filteredServices.length === 0 && (
          <p>No hay servicios que coincidan con los filtros.</p>
        )}
      </div>
    </aside>
  );
}
