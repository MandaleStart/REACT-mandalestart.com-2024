import { useMemo, useState } from 'react';
import { filterContractedServices, getContractedServices } from '../adminModel';

/* eslint-disable react/prop-types */
export default function AdminContractedServices({ clients, onManageClient }) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const contracts = useMemo(() => getContractedServices(clients), [clients]);
    const statuses = [...new Set(contracts.map((item) => item.status || 'Sin estado'))].sort();
    const filteredContracts = filterContractedServices(contracts, search, status);

    return (
        <section className="admin-contracts-panel">
            <div className="admin-contracts-toolbar">
                <label className="admin-client-search">
                    Buscar por usuario, correo o servicio
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-controls="admin-contracted-services"
                    />
                </label>
                <label className="admin-client-search">
                    Estado
                    <select value={status} onChange={(event) => setStatus(event.target.value)}>
                        <option value="all">Todos</option>
                        {statuses.map((serviceStatus) => (
                            <option key={serviceStatus} value={serviceStatus}>
                                {serviceStatus}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <p className="admin-search-count" aria-live="polite">
                {filteredContracts.length} de {contracts.length} servicios contratados
            </p>
            <div className="admin-table-wrap" id="admin-contracted-services">
                <table className="admin-data-table">
                    <thead>
                        <tr>
                            <th scope="col">Usuario</th>
                            <th scope="col">Servicio / recurso</th>
                            <th scope="col">Estado</th>
                            <th scope="col">Vencimiento</th>
                            <th scope="col"><span className="visually-hidden">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContracts.map((contract) => (
                            <tr key={contract.key}>
                                <td>
                                    <strong>{contract.clientName || 'Sin nombre'}</strong>
                                    <small>{contract.clientEmail}</small>
                                </td>
                                <td>
                                    <strong>{contract.title || contract.name || contract.type || 'Servicio'}</strong>
                                    {contract.title && contract.name && <small>{contract.name}</small>}
                                </td>
                                <td>{contract.status || 'Sin estado'}</td>
                                <td>{contract.expiry || 'Sin fecha'}</td>
                                <td>
                                    <button
                                        type="button"
                                        className="admin-table-action"
                                        onClick={() => onManageClient(contract.clientId)}
                                    >
                                        Administrar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredContracts.length === 0 && (
                            <tr>
                                <td colSpan="5">
                                    {contracts.length
                                        ? 'No hay servicios que coincidan con estos filtros.'
                                        : 'Todavía no hay servicios contratados.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}