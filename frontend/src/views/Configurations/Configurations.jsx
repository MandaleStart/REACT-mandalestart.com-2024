import { Link, useLocation } from 'react-router-dom';
import CatalogSettings from './CatalogSettings';
import './configurations.css';

export default function Configurations() {
    const { pathname } = useLocation();

    if (pathname === '/configuraciones/catalogo') return <CatalogSettings />;

    return (
        <main className="configurations-page">
            <header className="configurations-header">
                <div>
                    <span className="eyebrow">Administración</span>
                    <h1>Configuraciones</h1>
                </div>
                <Link className="secondary-button" to="/administracion">
                    Volver al panel
                </Link>
            </header>

            <section className="configuration-options" aria-label="Opciones de configuración">
                <Link className="configuration-option" to="/configuraciones/catalogo">
                    <span className="configuration-option-label">Sitio público</span>
                    <strong>Catálogo público</strong>
                    <span>Administrar los servicios que se muestran en el sitio.</span>
                </Link>
            </section>
        </main>
    );
}