/* eslint-disable react/prop-types */
export default function ClientServicesList({ services = [], clientId, userId }) {
  return (
    <section className="services-client-list">
      {services.length ? (
        services.map((service, index) => (
          <article
            key={service.id || `${clientId || userId}-${service.type}-${service.name}-${index}`}
            className="client-service-card"
          >
            <div className="service-head">
              <div>
                <span className="service-badge">{service.title}</span>
                <h2>{service.name}</h2>
              </div>
              <span className="service-status">{service.status}</span>
            </div>

            <div className="service-grid">
              <div>
                <span>Costo</span>
                <strong>{service.cost}</strong>
              </div>
              <div>
                <span>Vencimiento</span>
                <strong>{service.expiry}</strong>
              </div>
            </div>

            <div className="service-details">
              {service.details?.map((detail, detailIndex) => (
                <div key={`${detail.label}-${detailIndex}`} className="detail-row">
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))
      ) : (
        <article className="client-service-card">
          <div className="service-head">
            <div>
              <span className="service-badge">Sin servicios</span>
              <h2>Todavía no hay servicios asociados a esta cuenta</h2>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
