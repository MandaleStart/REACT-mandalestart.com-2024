/* eslint-disable react/prop-types */
export default function AdminClientList({
  clients,
  filteredClients,
  selectedClientId,
  search,
  onSearchChange,
  onNew,
  onSelect,
}) {
  return (
    <aside className="admin-list-panel">
      <div className="admin-panel-heading">
        <h2>Clientes</h2>
        <button type="button" onClick={onNew}>
          Nuevo
        </button>
      </div>
      <label className="admin-client-search">
        Buscar por nombre, email o teléfono
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-controls="admin-client-records"
        />
      </label>
      <p className="admin-search-count" aria-live="polite">
        {filteredClients.length} de {clients.length} clientes
      </p>
      <div className="admin-record-list" id="admin-client-records">
        {filteredClients.map((client) => (
          <button
            key={client.id}
            type="button"
            className={selectedClientId === client.id ? 'is-selected' : ''}
            onClick={() => onSelect(client.id)}
          >
            <strong>{client.name}</strong>
            <span>{client.email}</span>
          </button>
        ))}
        {clients.length === 0 && <p>No hay clientes cargados.</p>}
        {clients.length > 0 && filteredClients.length === 0 && (
          <p>No hay clientes que coincidan con la búsqueda.</p>
        )}
      </div>
    </aside>
  );
}
