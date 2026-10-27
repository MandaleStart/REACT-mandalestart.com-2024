const iconShapes = {
  code: (
    <>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 5-4 14" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7 4.7-2.3Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
      <path d="M17 6h3v3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  activity: (
    <>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" />
      <path d="M9 8.5c.5 2.5 2 4 4.5 5l1-1.3 2 .8c-.2 1.3-1.2 2-2.5 1.8-3.8-.7-6.2-3-6.8-6.3-.2-1.2.6-2.1 1.8-2.3l.8 2L9 8.5Z" />
    </>
  ),
  telegram: (
    <>
      <path d="m22 3-7 18-4-8-8-4 19-6Z" />
      <path d="m11 13 5-5" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 10v7M8 7h.01M12 17v-4a3 3 0 0 1 6 0v4M12 10v7" />
    </>
  ),
  fallback: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </>
  ),
};

const legacyIconNames = {
  '💻': 'code',
  '🌐': 'globe',
  '📧': 'mail',
  '🧭': 'compass',
  '📈': 'chart',
  '🔐': 'shield',
  '📡': 'activity',
  '🧩': 'cube',
  '💬': 'whatsapp',
  '✈️': 'telegram',
  '💼': 'linkedin',
};

// The icon name is a string key from the local catalog or public API.
// eslint-disable-next-line react/prop-types
export default function SiteIcon({ name }) {
  const iconName = legacyIconNames[name] || name;
  const shape = iconShapes[iconName] || iconShapes.fallback;

  return (
    <svg
      className="site-icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}
