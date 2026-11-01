import PortalSidebar from '../../components/PortalSidebar';

/* eslint-disable react/prop-types */
export default function AdminSidebar({ clientCount, legacyServiceCount, userCount }) {
  return (
    <PortalSidebar
      label="Secciones administrativas"
      items={[
        { to: '/administracion/dashboard', label: 'Panel' },
        { to: '/administracion/clients', label: 'Clientes', badge: clientCount },
        { to: '/administracion/subscriptions', label: 'Suscripciones' },
        { to: '/administracion/invoices', label: 'Facturas' },
        { to: '/administracion/plans', label: 'Planes y precios' },
        { to: '/administracion/configuraciones/catalogo', label: 'Catálogo público' },
        {
          to: '/administracion/contracts',
          label: 'Servicios heredados',
          badge: legacyServiceCount,
        },
        { to: '/administracion/users', label: 'Usuarios', badge: userCount },
        { to: '/administracion/audit', label: 'Auditoría' },
      ]}
    />
  );
}
