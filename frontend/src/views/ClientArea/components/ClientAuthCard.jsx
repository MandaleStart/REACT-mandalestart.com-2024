/* eslint-disable react/prop-types */
export default function ClientAuthCard({
  authMode,
  setAuthMode,
  error,
  setError,
  notice,
  setNotice,
  form,
  onInputChange,
  onRegister,
  onEmailLogin,
  onGoogleLogin,
  onPasswordReset,
  submitting,
  firebaseReady,
}) {
  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  return (
    <main className="client-area-page">
      <section className="client-login-shell">
        <div className="login-card">
          <span className="eyebrow">Atención al cliente</span>
          <h1>Ingresá a tu área de clientes</h1>
          <p>Usá la cuenta que te indicamos para consultar los servicios asociados.</p>

          {error && <div className="error-box" role="alert">{error}</div>}
          {notice && <div className="client-success-box" role="status">{notice}</div>}

          <div className="client-auth-switch" role="group" aria-label="Tipo de acceso">
            <button
              type="button"
              className={authMode === 'login' ? 'is-active' : ''}
              onClick={() => { setAuthMode('login'); clearMessages(); }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'is-active' : ''}
              onClick={() => { setAuthMode('register'); clearMessages(); }}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={authMode === 'register' ? onRegister : onEmailLogin}>
            {authMode === 'register' && (
              <div className="client-login-field">
                <label htmlFor="register-name">Nombre</label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onInputChange}
                  autoComplete="name"
                  maxLength="120"
                  required
                />
              </div>
            )}
            <div className="client-login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onInputChange}
                autoComplete="email"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="client-login-field password-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={onInputChange}
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                minLength={authMode === 'register' ? 8 : undefined}
                placeholder="••••••••"
                required
              />
            </div>

            {authMode === 'register' && (
              <div className="client-login-field password-field">
                <label htmlFor="confirm-password">Confirmar contraseña</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onInputChange}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </div>
            )}

            <button type="submit" className="secondary-button client-login-submit" disabled={submitting}>
              {submitting ? 'Procesando…' : authMode === 'register' ? 'Crear cuenta y verificar email' : 'Ingresar'}
            </button>
            {authMode === 'login' && (
              <button type="button" className="client-forgot-password" onClick={onPasswordReset} disabled={submitting}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>

          {firebaseReady && (
            <button type="button" className="google-button" onClick={onGoogleLogin} disabled={submitting}>
              {submitting ? 'Ingresando...' : 'Continuar con Google'}
            </button>
          )}
          <p className="client-login-note">
            El registro crea tu cuenta de acceso; para ver información del portal, el administrador debe asociar tu email verificado a una ficha de cliente.
          </p>
        </div>
      </section>
    </main>
  );
}
