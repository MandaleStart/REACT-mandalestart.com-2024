/* eslint-disable react/prop-types */
export default function AdminUserDirectory({
    users,
    selectedUid,
    search,
    onSearchChange,
    onSelect,
    onToggleDisabled,
    onManageClient,
    onCreateClient,
    onRetry,
    currentUid,
    busy,
    error,
}) {
    const query = search.trim().toLocaleLowerCase();
    const filteredUsers = users.filter((user) =>
        [user.displayName, user.email, user.clientName]
            .filter(Boolean)
            .some((value) => value.toLocaleLowerCase().includes(query)),
    );
    const selectedUser = users.find((user) => user.uid === selectedUid);

    return (
        <section className="admin-user-workspace">
            <aside className="admin-list-panel">
                <div className="admin-panel-heading">
                    <h2>Cuentas registradas</h2>
                </div>
                <label className="admin-client-search">
                    Buscar por nombre o correo
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        aria-controls="admin-user-records"
                    />
                </label>
                {error ? (
                    <div className="admin-feedback error" role="alert">
                        <p>{error}</p>
                        <button type="button" className="secondary-button" onClick={onRetry}>
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="admin-search-count" aria-live="polite">
                            {filteredUsers.length} de {users.length} cuentas
                        </p>
                        <div className="admin-record-list" id="admin-user-records">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.uid}
                                    type="button"
                                    className={selectedUid === user.uid ? 'is-selected' : ''}
                                    aria-pressed={selectedUid === user.uid}
                                    onClick={() => onSelect(user.uid)}
                                >
                                    <strong>{user.displayName || user.email || 'Cuenta sin nombre'}</strong>
                                    <span>{user.email || 'Sin correo'}</span>
                                    <small>
                                        {user.disabled ? 'Desactivada' : user.isAdmin ? 'Administración' : 'Activa'}
                                        {user.clientId ? ' · Ficha vinculada' : ''}
                                    </small>
                                </button>
                            ))}
                            {users.length === 0 && <p>No hay cuentas registradas.</p>}
                            {users.length > 0 && filteredUsers.length === 0 && (
                                <p>No hay cuentas que coincidan con la búsqueda.</p>
                            )}
                        </div>
                    </>
                )}
            </aside>

            <section className="admin-form-panel" aria-live="polite">
                {!selectedUser ? (
                    <div className="admin-empty-state">
                        <h2>Seleccioná una cuenta</h2>
                        <p>Vas a ver su estado de acceso y la ficha de cliente asociada.</p>
                    </div>
                ) : (
                    <>
                        <div className="admin-panel-heading">
                            <h2>{selectedUser.displayName || selectedUser.email || 'Cuenta'}</h2>
                        </div>
                        <dl className="admin-user-details">
                            <div>
                                <dt>Correo</dt>
                                <dd>{selectedUser.email || 'No disponible'}</dd>
                            </div>
                            <div>
                                <dt>Verificación</dt>
                                <dd>{selectedUser.emailVerified ? 'Verificado' : 'Pendiente'}</dd>
                            </div>
                            <div>
                                <dt>Tipo de cuenta</dt>
                                <dd>{selectedUser.isAdmin ? 'Administrador' : 'Usuario'}</dd>
                            </div>
                            <div>
                                <dt>Acceso</dt>
                                <dd>{selectedUser.disabled ? 'Desactivado' : 'Activo'}</dd>
                            </div>
                            <div>
                                <dt>Ficha de cliente</dt>
                                <dd>{selectedUser.clientName || 'Sin ficha vinculada'}</dd>
                            </div>
                        </dl>

                        <div className="admin-form-actions">
                            {selectedUser.clientId ? (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => onManageClient(selectedUser.clientId)}
                                >
                                    Administrar ficha
                                </button>
                            ) : selectedUser.email ? (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => onCreateClient(selectedUser)}
                                >
                                    Crear ficha de cliente
                                </button>
                            ) : null}
                            {selectedUser.uid !== currentUid && (
                                <button
                                    type="button"
                                    className={selectedUser.disabled ? 'secondary-button' : 'admin-danger-button'}
                                    disabled={busy}
                                    onClick={() => onToggleDisabled(selectedUser)}
                                >
                                    {selectedUser.disabled ? 'Reactivar cuenta' : 'Desactivar cuenta'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </section>
        </section>
    );
}