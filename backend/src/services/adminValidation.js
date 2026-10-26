import { randomUUID } from 'node:crypto';
import { staticServiceSlugs } from '../serviceCatalogFallback.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clientServiceTypes = new Set([
  'domain',
  'hosting',
  'email',
  'web',
  'seo',
  'ddns',
  'monitoring',
  '3d-printing',
  'other',
]);
const serviceStatuses = new Set(['active', 'archived']);
const serviceAccents = new Set(['cyan', 'blue', 'orange', 'purple', 'green', 'red', 'teal']);
const projectStatuses = new Set(['planned', 'in-progress', 'paused', 'completed']);
const milestoneStatuses = new Set(['pending', 'in-progress', 'completed']);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function invalid(message) {
  return { ok: false, message };
}

function validateDetails(details) {
  if (details === undefined) return { ok: true, value: [] };
  if (!Array.isArray(details) || details.length > 30) {
    return invalid('Los detalles del servicio deben ser una lista de hasta 30 elementos.');
  }

  const value = [];
  for (const detail of details) {
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
      return invalid('Cada detalle debe tener una etiqueta y un valor.');
    }
    const label = text(detail.label, 80);
    const detailValue = text(detail.value, 250);
    if (!label || !detailValue) {
      return invalid('Cada detalle debe tener una etiqueta y un valor.');
    }
    value.push({ label, value: detailValue });
  }
  return { ok: true, value };
}

function validateOptionalDate(value, message) {
  const date = text(value, 10);
  if (date && (!isoDatePattern.test(date)
    || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))
    || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date)) {
    return invalid(message);
  }
  return { ok: true, value: date };
}

export function validateClientProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('El perfil debe ser un objeto válido.');
  }
  const name = text(input.name, 120);
  const phone = text(input.phone, 40);
  if (!name) return invalid('El nombre es obligatorio.');
  if (phone && !/^[+0-9().\s-]{5,40}$/.test(phone)) {
    return invalid('Ingresá un número de teléfono válido.');
  }
  return { ok: true, value: { name, phone } };
}

export function validateClientProjects(projects) {
  if (projects === undefined) return { ok: true, value: [] };
  if (!Array.isArray(projects) || projects.length > 50) {
    return invalid('Los proyectos deben ser una lista de hasta 50 elementos.');
  }

  const projectIds = new Set();
  const value = [];
  for (const project of projects) {
    if (!project || typeof project !== 'object' || Array.isArray(project)) {
      return invalid('Cada proyecto debe ser un objeto válido.');
    }
    const id = text(project.id, 100) || randomUUID();
    const title = text(project.title, 140);
    const description = text(project.description, 1000);
    const status = text(project.status, 40);
    if (!title || !projectStatuses.has(status)) {
      return invalid('Cada proyecto necesita un título y un estado válido.');
    }
    if (projectIds.has(id)) return invalid('Los identificadores de proyecto deben ser únicos.');
    projectIds.add(id);

    const startDate = validateOptionalDate(project.startDate, 'La fecha de inicio debe ser válida (AAAA-MM-DD).');
    const targetDate = validateOptionalDate(project.targetDate, 'La fecha objetivo debe ser válida (AAAA-MM-DD).');
    if (!startDate.ok) return startDate;
    if (!targetDate.ok) return targetDate;
    if (startDate.value && targetDate.value && targetDate.value < startDate.value) {
      return invalid('La fecha objetivo no puede ser anterior a la fecha de inicio.');
    }

    const milestones = project.milestones === undefined ? [] : project.milestones;
    if (!Array.isArray(milestones) || milestones.length > 50) {
      return invalid('Cada proyecto puede tener hasta 50 hitos o entregas.');
    }
    const milestoneIds = new Set();
    const validatedMilestones = [];
    for (const milestone of milestones) {
      if (!milestone || typeof milestone !== 'object' || Array.isArray(milestone)) {
        return invalid('Cada hito debe ser un objeto válido.');
      }
      const milestoneId = text(milestone.id, 100) || randomUUID();
      const milestoneTitle = text(milestone.title, 140);
      const milestoneStatus = text(milestone.status, 40);
      const dueDate = validateOptionalDate(milestone.dueDate, 'La fecha del hito debe ser válida (AAAA-MM-DD).');
      if (!milestoneTitle || !milestoneStatuses.has(milestoneStatus) || !dueDate.ok) {
        return invalid('Cada hito necesita un título, estado y fecha válida.');
      }
      if (milestoneIds.has(milestoneId)) return invalid('Los identificadores de hitos deben ser únicos.');
      milestoneIds.add(milestoneId);
      validatedMilestones.push({
        id: milestoneId,
        title: milestoneTitle,
        description: text(milestone.description, 500),
        status: milestoneStatus,
        dueDate: dueDate.value,
      });
    }

    value.push({
      id,
      title,
      description,
      status,
      startDate: startDate.value,
      targetDate: targetDate.value,
      milestones: validatedMilestones,
    });
  }
  return { ok: true, value };
}

export function validateClientRecord(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('El cliente debe ser un objeto válido.');
  }

  const name = text(input.name, 120);
  const email = text(input.email, 254).toLowerCase();
  const profile = validateClientProfile({ name, phone: input.phone });
  const projects = validateClientProjects(input.projects);
  if (!name) return invalid('El nombre del cliente es obligatorio.');
  if (!profile.ok) return profile;
  if (!projects.ok) return projects;
  if (!emailPattern.test(email)) return invalid('Ingresá un email válido para el cliente.');
  if (!Array.isArray(input.services) || input.services.length > 100) {
    return invalid('Los servicios del cliente deben ser una lista de hasta 100 elementos.');
  }

  const services = [];
  const serviceIds = new Set();
  for (const service of input.services) {
    if (!service || typeof service !== 'object' || Array.isArray(service)) {
      return invalid('Cada servicio contratado debe ser un objeto válido.');
    }

    const type = text(service.type, 40);
    const title = text(service.title, 120);
    const nameValue = text(service.name, 200);
    const expiry = text(service.expiry, 10);
    if (!clientServiceTypes.has(type)) return invalid('Elegí un tipo de servicio válido.');
    if (!title || !nameValue) return invalid('Cada servicio debe tener título y nombre.');
    if (expiry && (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)
      || Number.isNaN(Date.parse(`${expiry}T00:00:00.000Z`))
      || new Date(`${expiry}T00:00:00.000Z`).toISOString().slice(0, 10) !== expiry)) {
      return invalid('La fecha de vencimiento debe ser una fecha válida en formato AAAA-MM-DD.');
    }

    const details = validateDetails(service.details);
    if (!details.ok) return details;

    const id = text(service.id, 100) || randomUUID();
    if (serviceIds.has(id)) return invalid('Los servicios contratados deben tener identificadores únicos.');
    serviceIds.add(id);
    services.push({
      id,
      type,
      title,
      name: nameValue,
      cost: text(service.cost, 100),
      expiry,
      status: text(service.status, 40),
      details: details.value,
    });
  }

  return { ok: true, value: { name, email, phone: profile.value.phone, services, projects: projects.value } };
}

function validateStringList(value, field, maxItems, maxLength) {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value) || value.length > maxItems) {
    return invalid(`${field} debe ser una lista válida.`);
  }

  const strings = value.map((item) => text(item, maxLength));
  if (strings.some((item) => !item)) return invalid(`${field} no puede contener elementos vacíos.`);
  return { ok: true, value: strings };
}

export function validatePublicService(input, requestedSlug = '') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('El servicio debe ser un objeto válido.');
  }

  const slug = text(requestedSlug || input.slug, 80).toLowerCase();
  const title = text(input.title, 140);
  const category = text(input.category, 100);
  const description = text(input.description, 1000);
  if (!slugPattern.test(slug)) return invalid('El identificador debe usar minúsculas, números y guiones.');
  if (!staticServiceSlugs.has(slug)) {
    return invalid('Solo se pueden administrar slugs con una ruta estática publicada.');
  }
  const status = text(input.status, 40) || 'active';
  const accent = text(input.accent, 40) || 'cyan';
  if (!serviceStatuses.has(status)) return invalid('Elegí un estado válido para el servicio.');
  if (!serviceAccents.has(accent)) return invalid('Elegí un acento visual válido.');
  if (!title || !category || !description) {
    return invalid('El título, la categoría y la descripción son obligatorios.');
  }

  const points = validateStringList(input.points, 'Los puntos del servicio', 20, 200);
  if (!points.ok) return points;
  const includes = validateStringList(input.includes, 'Los elementos incluidos', 20, 200);
  if (!includes.ok) return includes;

  return {
    ok: true,
    value: {
      slug,
      title,
      category,
      description,
      price: text(input.price, 120),
      status,
      accent,
      icon: text(input.icon, 30),
      summary: text(input.summary, 500),
      outcome: text(input.outcome, 1000),
      points: points.value,
      includes: includes.value,
    },
  };
}

export function projectPublicService(id, service) {
  return {
    id,
    slug: id,
    title: text(service.title, 140),
    category: text(service.category, 100),
    description: text(service.description, 1000),
    price: text(service.price, 120),
    status: text(service.status, 40),
    accent: text(service.accent, 40),
    icon: text(service.icon, 30),
    summary: text(service.summary, 500),
    outcome: text(service.outcome, 1000),
    points: Array.isArray(service.points) ? service.points.filter((item) => typeof item === 'string').slice(0, 20) : [],
    includes: Array.isArray(service.includes) ? service.includes.filter((item) => typeof item === 'string').slice(0, 20) : [],
  };
}
