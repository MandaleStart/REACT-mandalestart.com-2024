const serviceOptions = [
  { value: 'web', slug: 'web', fallback: 'Desarrollo web' },
  { value: 'hosting', slug: 'hosting', fallback: 'Hosting y dominios' },
  { value: 'correo', slug: 'email', fallback: 'Correo corporativo' },
  { value: 'seo', slug: 'seo', fallback: 'SEO' },
  { value: 'ddns', slug: 'ddns', fallback: 'DDNS y acceso remoto' },
  { value: 'red', slug: 'monitoring', fallback: 'Redes, servidores y monitoreo' },
  { value: 'impresion', slug: 'impresion-3d', fallback: 'Diseño e impresión 3D' },
];

export function getContactServiceOptions(catalog) {
  return [
    ...serviceOptions.map((option) => ({
      value: option.value,
      label: catalog.find((service) => service.slug === option.slug)?.title || option.fallback,
    })),
    { value: 'otro', label: 'Otro' },
  ];
}
