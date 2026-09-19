export const mockDb = {
  authUsers: [
    {
      uid: 'demo-google-user',
      email: 'clientea@demo.com',
      name: 'Cliente Demo Google',
      password: null,
      provider: 'google',
      role: 'client',
    },
    {
      uid: 'demo-email-user',
      email: 'clienteb@demo.com',
      name: 'Cliente Demo Email',
      password: 'demo1234',
      provider: 'email',
      role: 'client',
    },
  ],
  services: [
    {
      id: 'svc-001',
      slug: 'web',
      title: 'Desarrollo web',
      category: 'Web premium',
      description: 'Sitios, landing pages y sistemas para vender, captar clientes y proyectar seriedad.',
      price: 'Desde $450',
      status: 'active',
      accent: 'cyan',
    },
    {
      id: 'svc-002',
      slug: 'hosting',
      title: 'Hosting web',
      category: 'Alojamiento',
      description: 'Alojamiento estable para mantener tu sitio disponible, rápido y con soporte.',
      price: 'Desde $30/mes',
      status: 'active',
      accent: 'blue',
    },
    {
      id: 'svc-003',
      slug: 'email',
      title: 'Email corporativo',
      category: 'Comunicación',
      description: 'Correos con tu dominio para una imagen más profesional y confiable.',
      price: 'Desde $20/mes',
      status: 'active',
      accent: 'orange',
    },
    {
      id: 'svc-004',
      slug: 'seo',
      title: 'SEO y posicionamiento',
      category: 'Visibilidad',
      description: 'Optimización técnica y de contenido para aparecer más en buscadores.',
      price: 'Desde $220',
      status: 'active',
      accent: 'green',
    },
  ],
  clients: [
    {
      uid: 'cliente-a',
      name: 'Cliente A',
      email: 'clientea@demo.com',
      services: [
        {
          type: 'domain',
          title: 'Dominio',
          name: 'mandalepro.com',
          cost: '$120 / año',
          expiry: '2027-03-15',
          status: 'Activo',
          details: [
            { label: 'Registro', value: 'GoDaddy' },
            { label: 'DNS', value: 'Configurado' },
            { label: 'Renovación', value: '15/03/2027' },
          ],
        },
      ],
    },
    {
      uid: 'cliente-b',
      name: 'Cliente B',
      email: 'clienteb@demo.com',
      services: [
        {
          type: 'hosting',
          title: 'Hosting',
          name: 'cliente-b-web',
          cost: '$34 / mes',
          expiry: '2026-12-01',
          status: 'Activo',
          details: [
            { label: 'Plan', value: 'Business Pro' },
            { label: 'Espacio', value: '120 GB SSD' },
            { label: 'Copias', value: 'Diarias' },
          ],
        },
      ],
    },
  ],
};

export const getMockServices = () => mockDb.services;

export const getMockServiceBySlug = (slug) =>
  mockDb.services.find((service) => service.slug === slug) || null;

export const getMockClients = () => mockDb.clients;

export const getMockClientByEmail = (email = '') => {
  const normalizedEmail = email.trim().toLowerCase();
  return mockDb.clients.find((client) => client.email.toLowerCase() === normalizedEmail) || null;
};

export const getMockAuthUser = ({ email = '', password = '', provider = 'email' } = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const match = mockDb.authUsers.find((user) => {
    const sameEmail = user.email.toLowerCase() === normalizedEmail;
    const sameProvider = user.provider === provider;
    const samePassword = !user.password || password === user.password;
    return sameEmail && sameProvider && samePassword;
  });

  return match || null;
};

export const getMockAuthUserByToken = (token = '') => {
  if (!token) return null;

  if (token === 'demo-google-token') {
    return mockDb.authUsers.find((user) => user.provider === 'google') || null;
  }

  if (token === 'demo-email-token') {
    return mockDb.authUsers.find((user) => user.provider === 'email') || null;
  }

  return null;
};
