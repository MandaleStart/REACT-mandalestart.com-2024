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

          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="client-success-box" role="status">
              {notice}
            </div>
          )}

          <div className="client-auth-switch" role="group" aria-label="Tipo de acceso">
            <button
              type="button"
              className={authMode === 'login' ? 'is-active' : ''}
              onClick={() => {
                setAuthMode('login');
                clearMessages();
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'is-active' : ''}
              onClick={() => {
                setAuthMode('register');
                clearMessages();
              }}
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

            <button
              type="submit"
              className="secondary-button client-login-submit"
              disabled={submitting}
            >
              {submitting
                ? 'Procesando…'
                : authMode === 'register'
                  ? 'Crear cuenta y verificar email'
                  : 'Ingresar'}
            </button>
            {authMode === 'login' && (
              <button
                type="button"
                className="client-forgot-password"
                onClick={onPasswordReset}
                disabled={submitting}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>

          {firebaseReady && (
            <button
              type="button"
              className="google-button"
              onClick={onGoogleLogin}
              disabled={submitting}
              aria-busy={submitting}
            >
              <svg
                className="google-button-icon"
                viewBox="0 0 48 48"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.64 5.93c4.46-4.11 7.12-10.16 7.12-17.58Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.64-5.93c-2.12 1.42-4.84 2.27-8.26 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                />
              </svg>
              <span>{submitting ? 'Ingresando...' : 'Continuar con Google'}</span>
            </button>
          )}
          <p className="client-login-note">
            El registro crea tu cuenta de acceso; para ver información del portal, el administrador
            debe asociar tu email verificado a una ficha de cliente.
          </p>
        </div>
      </section>
    </main>
  );
}
