import { NavLink } from 'react-router-dom';
import './PortalSidebar.css';

/* eslint-disable react/prop-types */
export default function PortalSidebar({ label, items, onLogout }) {
  return (
    <nav className="portal-sidebar" aria-label={label}>
      {items.map(({ to, label: itemLabel, end = false, badge }) => (
        <NavLink key={to} to={to} end={end}>
          <span>{itemLabel}</span>
          {badge ? <small>{badge}</small> : null}
        </NavLink>
      ))}
      {onLogout ? (
        <button type="button" className="portal-sidebar-logout" onClick={onLogout}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      ) : null}
    </nav>
  );
}
