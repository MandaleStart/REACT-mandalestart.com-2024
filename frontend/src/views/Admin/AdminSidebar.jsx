import PortalSidebar from '../../components/PortalSidebar';

/* eslint-disable react/prop-types */
export default function AdminSidebar({ clientCount, userCount, onLogout }) {
  return (
    <PortalSidebar
      label="Secciones administrativas"
      onLogout={onLogout}
      items={[
        { to: '/administracion/dashboard', label: 'Panel' },
        { to: '/administracion/clients', label: 'Clientes', badge: clientCount },
        { to: '/administracion/subscriptions', label: 'Suscripciones' },
        { to: '/administracion/invoices', label: 'Facturas' },
        { to: '/administracion/unapplied-payments', label: 'Pagos para revisar' },
        { to: '/administracion/plans', label: 'Planes y precios' },
        { to: '/administracion/configuraciones/catalogo', label: 'Catálogo público' },
        { to: '/administracion/users', label: 'Usuarios', badge: userCount },
        { to: '/administracion/audit', label: 'Auditoría' },
      ]}
    />
  );
}
