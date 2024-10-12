import './cv.css';
import { contacto, extracto, habilidades, experiencia, educacion, certificaciones } from './modulos';

function CV() {
    return (
        <div>
            <header className='header-cv'>
                <h1>Nicolás Jorge</h1>
                <p>Desarrollador Web Frontend | React | JavaScript | TypeScript | NodeJS | ASP.NET | C#</p>
                <p>Ubicación: {contacto.ubicacion}</p>
            </header>

            <div className="cv-container">
                {/* Sección de Extracto */}
                <section className="extracto">
                    <h2>Extracto</h2>
                    <p>{extracto}</p>
                </section>
                <div className="column column-1">
                    {/* Sección de Contacto */}
                    <section className="contacto">
                        <h2>Contacto</h2>
                        <ul>
                            <li>Teléfono: <a href={`tel:+598${contacto.telefono}`}>{contacto.telefono}</a></li>
                            <li>Email: <a href={`mailto:${contacto.email}`}>{contacto.email}</a></li>
                            <li>LinkedIn: <a href={contacto.linkedin} target="_blank" rel="noopener noreferrer">Perfil de LinkedIn</a></li>
                        </ul>
                    </section>

                    {/* Sección de Habilidades */}
                    <section className="habilidades">
                        <h2>Habilidades</h2>
                        <ul>
                            {habilidades.map((habilidad, index) => (
                                <li key={index}>{habilidad}</li>
                            ))}
                        </ul>
                    </section>

                    {/* Sección de Educación */}
                    <section className="educacion">
                        <h2>Educación</h2>
                        <ul>
                            {educacion.map((edu, index) => (
                                <li key={index}>{edu}</li>
                            ))}
                        </ul>
                    </section>
                    {/* Sección de Experiencia */}
                    <section className='section-cv experiencia'>
                        <h2>Experiencia Profesional</h2>
                        {experiencia.map((exp, index) => (
                            <div key={index}>
                                <h3>{exp.empresa}</h3>
                                <p>{exp.puesto} - {exp.fecha} - {exp.ubicacion}</p>
                            </div>
                        ))}
                    </section>
                </div>

                {/* Sección de Certificaciones */}
                <div className="column column-2">
                    <section className="certificaciones">
                        <h2>Certificaciones</h2>
                        <ul>
                            {certificaciones.map((certificacion, index) => (
                                <li key={index}>
                                    <div className="certificacion-info">
                                        <a
                                            href={certificacion.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="certificacion-nombre">
                                            {certificacion.nombre}
                                        </a>
                                        <span className="certificacion-institucion">{certificacion.institucion}
                                            {certificacion.universidad && (
                                                <span>, impartido por {certificacion.universidad}</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="certificacion-nota">
                                        Nota: {certificacion.nota}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section></div>


            </div>
        </div>
    );
}

export default CV;