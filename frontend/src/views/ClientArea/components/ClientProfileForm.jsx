/* eslint-disable react/prop-types */
export default function ClientProfileForm({
  profileForm,
  setProfileForm,
  email,
  onSubmit,
  submitting,
}) {
  return (
    <form className="client-panel client-profile-form" onSubmit={onSubmit}>
      <div className="client-panel-heading">
        <div>
          <span className="panel-tag">Cuenta</span>
          <h2>Datos de contacto</h2>
        </div>
      </div>
      <label htmlFor="profile-name">Nombre</label>
      <input
        id="profile-name"
        value={profileForm.name}
        onChange={(event) =>
          setProfileForm((current) => ({ ...current, name: event.target.value }))
        }
        maxLength="120"
        required
      />
      <label htmlFor="profile-email">Email verificado</label>
      <input id="profile-email" type="email" value={email || ''} readOnly />
      <label htmlFor="profile-phone">Teléfono</label>
      <input
        id="profile-phone"
        type="tel"
        value={profileForm.phone}
        onChange={(event) =>
          setProfileForm((current) => ({ ...current, phone: event.target.value }))
        }
        maxLength="40"
        autoComplete="tel"
      />
      <button type="submit" className="secondary-button" disabled={submitting}>
        Guardar contacto
      </button>
    </form>
  );
}
