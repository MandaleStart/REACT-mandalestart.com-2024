import './cv.css';
import { useContact } from '../../config/useContact';
import { SITE, mailtoUrl, telUrl } from '../../config/site';
import { extracto, habilidades, certificaciones, aptitudes, idiomas } from './modulos';

function CurriculumVitae() {
    const contact = useContact();

    return (
        <main className="cv-page">
            <header className='header-cv'>
                <h1>Nicolás Jorge</h1>
                <p>Desarrollador Web Frontend | React | JavaScript | TypeScript | NodeJS | ASP.NET | C#</p>
            </header>

            <div className="cv-container">
                <section className="extracto">
                    <h2>Perfil</h2>
                    <p>{extracto}</p>
                </section>
                <div className="column column-1">
                    <section className="contacto">
                        <h2>Contacto</h2>
                        <ul>
                            {contact.phone && <li>Teléfono: <a href={telUrl(contact)}>{contact.phone.display}</a></li>}
                            <li>Email: <a href={mailtoUrl(contact)}>{contact.email}</a></li>
                            <li>LinkedIn: <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">Perfil de LinkedIn</a></li>
                        </ul>
                    </section>

                    {/* Sección de Habilidades */}
                    <section className="habilidades">
                        <h2>Habilidades</h2>
                        <ul>
                            {habilidades.map((habilidad) => (
                                <li key={habilidad}>{habilidad}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="aptitudes">
                        <h2>Aptitudes principales</h2>
                        <ul>
                            {aptitudes.map((aptitud) => (
                                <li key={aptitud}>{aptitud}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="idiomas">
                        <h2>Idiomas</h2>
                        <ul>
                            {idiomas.map((idioma) => (
                                <li key={idioma}>{idioma}</li>
                            ))}
                        </ul>
                    </section>

                </div>

                <div className="column column-2">
                    <section className="certificaciones">
                        <h2>Certificaciones</h2>
                        <ul>
                            {certificaciones.map((certificacion) => (
                                <li key={certificacion.nombre}>
                                    <div className="certificacion-info">
                                        {certificacion.link ? <a href={certificacion.link} target="_blank" rel="noopener noreferrer" className="certificacion-nombre">{certificacion.nombre}</a> : <span className="certificacion-nombre">{certificacion.nombre}</span>}
                                        {certificacion.institucion && <span className="certificacion-institucion">{certificacion.institucion}
                                            {certificacion.universidad && (
                                                <span>, impartido por {certificacion.universidad}</span>
                                            )}
                                        </span>}
                                        {certificacion.expedicion && <span className="certificacion-institucion">Expedición: {certificacion.expedicion}</span>}
                                        {certificacion.id && <span className="certificacion-institucion">ID de credencial: {certificacion.id}</span>}
                                    </div>
                                    {certificacion.nota && <span className="certificacion-nota">Nota: {certificacion.nota}</span>}
                                </li>
                            ))}
                        </ul>
                    </section></div>


            </div>
        </main>
    );
}

export default CurriculumVitae;