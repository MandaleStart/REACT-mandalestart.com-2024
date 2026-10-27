import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase';
import './profile.css';

/* eslint-disable react/prop-types */
export default function Profile({ user, isAdmin }) {
    const [error, setError] = useState('');
    const roleLabel = isAdmin ? 'Administrador' : 'Cliente';
    const areaPath = isAdmin ? '/administracion' : '/area-cliente';

    const handleSignOut = async () => {
        setError('');
        try {
            if (auth) await signOut(auth);
        } catch {
            setError('No se pudo cerrar la sesión. Volvé a intentarlo.');
        }
    };

    return (
        <main className="profile-page">
            <section className="profile-card" aria-labelledby="profile-title">
                <span className="eyebrow">Cuenta</span>
                <h1 id="profile-title">{user.displayName || user.email || 'Mi perfil'}</h1>
                <p className="profile-intro">Información de tu cuenta de MandaleStart.</p>

                <dl className="profile-details">
                    <div>
                        <dt>Nombre</dt>
                        <dd>{user.displayName || 'Sin nombre configurado'}</dd>
                    </div>
                    <div>
                        <dt>Correo electrónico</dt>
                        <dd>{user.email || 'No disponible'}</dd>
                    </div>
                    <div>
                        <dt>Verificación de correo</dt>
                        <dd>{user.emailVerified ? 'Verificado' : 'Pendiente'}</dd>
                    </div>
                    <div>
                        <dt>Tipo de cuenta</dt>
                        <dd>{roleLabel}</dd>
                    </div>
                </dl>

                {error && <p className="profile-error" role="alert">{error}</p>}

                <div className="profile-actions">
                    <Link className="primary-button" to={areaPath}>
                        {isAdmin ? 'Ir a administración' : 'Ir al área de cliente'}
                    </Link>
                    <button className="secondary-button" type="button" onClick={handleSignOut}>
                        Cerrar sesión
                    </button>
                </div>
            </section>
        </main>
    );
}