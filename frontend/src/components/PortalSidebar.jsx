import { NavLink } from 'react-router-dom';

/* eslint-disable react/prop-types */
export default function PortalSidebar({ label, items }) {
  return (
    <nav className="portal-sidebar" aria-label={label}>
      {items.map(({ to, label: itemLabel, end = false, badge }) => (
        <NavLink key={to} to={to} end={end}>
          <span>{itemLabel}</span>
          {badge ? <small>{badge}</small> : null}
        </NavLink>
      ))}
    </nav>
  );
}
