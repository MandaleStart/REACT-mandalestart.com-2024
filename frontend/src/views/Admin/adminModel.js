export const emptyClient = { id: '', name: '', email: '', phone: '', services: [], projects: [] };
export const emptyPublicService = {
  slug: '',
  icon: '',
  title: '',
  category: '',
  description: '',
  summary: '',
  outcome: '',
  price: 'Presupuesto a medida',
  accent: 'cyan',
  status: 'active',
  points: [],
  includes: [],
};

export const clientServiceTypes = [
  ['domain', 'Dominio'],
  ['hosting', 'Hosting'],
  ['email', 'Correo'],
  ['web', 'Desarrollo web'],
  ['seo', 'SEO'],
  ['ddns', 'DDNS'],
  ['monitoring', 'Monitoreo'],
  ['3d-printing', 'Diseño e impresión 3D'],
  ['other', 'Otro'],
];

export const expiredSessionMessage = 'Tu sesión venció, volvé a ingresar.';

export function isSessionError(error) {
  return error.status === 401 || error.status === 403;
}

export function parseDetails(value) {
  if (!value.trim()) return [];
  return value.split('\n').map((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error('Escribí cada detalle como Etiqueta: valor.');
    return {
      label: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    };
  });
}

export function formatDetails(details = []) {
  return details.map(({ label, value }) => `${label}: ${value}`).join('\n');
}

export function serviceToForm(service) {
  return { ...service, detailsText: formatDetails(service.details) };
}

export function projectToForm(project) {
  return {
    ...project,
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
  };
}
