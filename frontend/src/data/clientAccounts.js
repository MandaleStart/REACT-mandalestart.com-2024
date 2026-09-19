export const clientAccounts = [
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
          { label: 'Registro', value: 'Godaddy' },
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
      {
        type: 'email',
        title: 'Mail corporativo',
        name: 'info@clienteb.com',
        cost: '$18 / mes',
        expiry: '2026-12-01',
        status: 'Activo',
        details: [
          { label: 'Cuenta', value: '5 usuarios' },
          { label: 'Proveedor', value: 'Google Workspace' },
          { label: 'Soporte', value: 'Incluido' },
        ],
      },
      {
        type: 'monitoring',
        title: 'Monitoreo de 3 servidores',
        name: 'Infraestructura crítica',
        cost: '$180 / mes',
        expiry: '2026-12-01',
        status: 'Activo',
        details: [
          { label: 'Servidores', value: '3' },
          { label: 'Uptime', value: '99.98%' },
          { label: 'Alertas', value: 'Activas' },
        ],
      },
    ],
  },
];

export const getClientDataByEmail = (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  return clientAccounts.find((client) => client.email.toLowerCase() === normalizedEmail) || null;
};
