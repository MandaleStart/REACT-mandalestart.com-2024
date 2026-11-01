/* eslint-disable react/prop-types */
export default function ClientProfileForm({
  profileForm,
  setProfileForm,
  email,
  onSubmit,
  submitting,
  onExport,
  exporting,
}) {
  return (
    <form className="client-panel client-profile-form" onSubmit={onSubmit}>
      <div className="client-panel-heading">
        <div>
          <span className="panel-tag">Cuenta</span>
          <h2>Datos personales y de facturación</h2>
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
      <label htmlFor="profile-company">Razón social</label>
      <input
        id="profile-company"
        value={profileForm.company}
        onChange={(event) =>
          setProfileForm((current) => ({ ...current, company: event.target.value }))
        }
        maxLength="160"
        autoComplete="organization"
      />
      <label htmlFor="profile-tax-id">RUT o documento</label>
      <input
        id="profile-tax-id"
        value={profileForm.tax_id}
        onChange={(event) =>
          setProfileForm((current) => ({ ...current, tax_id: event.target.value }))
        }
        maxLength="30"
        autoComplete="off"
      />
      <label htmlFor="profile-billing-email">Email para recibir información de facturación</label>
      <input
        id="profile-billing-email"
        type="email"
        value={profileForm.billing_email}
        onChange={(event) =>
          setProfileForm((current) => ({ ...current, billing_email: event.target.value }))
        }
        maxLength="254"
        autoComplete="email"
      />
      <label htmlFor="profile-billing-address">Dirección de facturación</label>
      <textarea
        id="profile-billing-address"
        value={profileForm.billing_address}
        onChange={(event) =>
          setProfileForm((current) => ({ ...current, billing_address: event.target.value }))
        }
        maxLength="240"
        rows="3"
        autoComplete="street-address"
      />
      <button type="submit" className="secondary-button" disabled={submitting}>
        Guardar perfil
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={onExport}
        disabled={exporting || submitting}
      >
        {exporting ? 'Preparando descarga…' : 'Descargar una copia de mis datos'}
      </button>
    </form>
  );
}
