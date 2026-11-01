const DAY_MS = 86400000;
const MONTEVIDEO_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    const date = new Date(timestamp);
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) return null;
    return timestamp;
}

function getMontevideoToday(now) {
    const parts = MONTEVIDEO_DATE_FORMATTER.formatToParts(now);
    const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return Date.UTC(Number(date.year), Number(date.month) - 1, Number(date.day));
}

function getDaysFromToday(value, today) {
    const dueDate = parseDate(value);
    return dueDate === null ? null : Math.round((dueDate - today) / DAY_MS);
}

export function buildClientDashboard(clientRecord, { now = new Date() } = {}) {
    const client = clientRecord && typeof clientRecord === 'object' ? clientRecord : {};
    const today = getMontevideoToday(now);
    const services = Array.isArray(client.services) ? client.services : [];
    const projects = Array.isArray(client.projects) ? client.projects : [];
    const activeServices = services.filter((service) => service && service.status === 'active');
    const milestones = projects.flatMap((project) => (Array.isArray(project.milestones) ? project.milestones : []).map((milestone) => ({
        projectTitle: project.title || 'Proyecto',
        ...milestone,
    }))).filter((milestone) => milestone && milestone.dueDate && milestone.status !== 'completed');
    const upcomingMilestones = milestones
        .filter((milestone) => {
            const diffDays = getDaysFromToday(milestone.dueDate, today);
            return diffDays !== null && diffDays >= 0;
        })
        .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
    const overdueMilestones = milestones
        .filter((milestone) => {
            const diffDays = getDaysFromToday(milestone.dueDate, today);
            return diffDays !== null && diffDays < 0;
        })
        .map((milestone) => ({
            kind: 'milestone',
            title: milestone.title || 'Hito',
            projectTitle: milestone.projectTitle,
            dueDate: milestone.dueDate,
            daysOverdue: Math.abs(getDaysFromToday(milestone.dueDate, today)),
        }));

    const alerts = [];
    const overdue = [];
    for (const service of services) {
        if (!service) continue;
        const diffDays = getDaysFromToday(service.expiry, today);
        if (diffDays === null) continue;
        const serviceTitle = service.title || service.name || 'Servicio';
        if (diffDays < 0) {
            overdue.push({
                type: 'service-expiry',
                serviceTitle,
                dueDate: service.expiry,
                daysOverdue: Math.abs(diffDays),
            });
        } else if (diffDays <= 30) {
            alerts.push({
                type: 'service-expiry',
                serviceTitle,
                dueDate: service.expiry,
                diffDays,
            });
        }
    }

    return {
        overview: {
            totalServices: services.length,
            activeServices: activeServices.length,
            totalProjects: projects.length,
            upcomingMilestones: upcomingMilestones.length,
            overdueServices: overdue.length,
            overdueMilestones: overdueMilestones.length,
        },
        nextMilestone: upcomingMilestones[0] ? {
            title: upcomingMilestones[0].title,
            projectTitle: upcomingMilestones[0].projectTitle,
            dueDate: upcomingMilestones[0].dueDate,
            status: upcomingMilestones[0].status,
        } : null,
        alerts: alerts.slice(0, 5),
        overdue: overdue.slice(0, 5),
        overdueMilestones: overdueMilestones.slice(0, 5),
        activeServices: activeServices.slice(0, 5),
    };
}

export function buildAdminDashboard(clientRecords, { now = new Date() } = {}) {
    const clients = Array.isArray(clientRecords)
        ? clientRecords.filter((record) => record && typeof record === 'object')
        : [];
    const today = getMontevideoToday(now);
    const priorities = [];
    const overdueItems = [];

    for (const record of clients) {
        if (!record || typeof record !== 'object') continue;
        const services = Array.isArray(record.services) ? record.services : [];
        const projects = Array.isArray(record.projects) ? record.projects : [];
        const clientName = record.name || record.email || 'Cliente';

        for (const service of services) {
            if (!service || service.status !== 'active') continue;
            const diffDays = getDaysFromToday(service.expiry, today);
            if (diffDays === null) continue;
            const item = {
                kind: 'service-expiry',
                client: clientName,
                title: service.title || service.name || 'Servicio',
                dueDate: service.expiry,
            };
            if (diffDays < 0) {
                overdueItems.push({ ...item, daysOverdue: Math.abs(diffDays) });
            } else if (diffDays <= 30) {
                priorities.push({ ...item, diffDays });
            }
        }

        for (const project of projects) {
            if (!project || !Array.isArray(project.milestones)) continue;
            for (const milestone of project.milestones) {
                if (!milestone || !milestone.dueDate || milestone.status === 'completed') continue;
                const diffDays = getDaysFromToday(milestone.dueDate, today);
                if (diffDays === null) continue;
                const item = {
                    kind: 'milestone',
                    client: clientName,
                    project: project.title || 'Proyecto',
                    title: milestone.title || 'Hito',
                    dueDate: milestone.dueDate,
                };
                if (diffDays < 0) {
                    overdueItems.push({ ...item, daysOverdue: Math.abs(diffDays) });
                } else if (diffDays <= 30) {
                    priorities.push({ ...item, diffDays });
                }
            }
        }
    }

    priorities.sort((a, b) => a.diffDays - b.diffDays);
    overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const allServices = clients.flatMap((client) => Array.isArray(client?.services) ? client.services : []);
    const allProjects = clients.flatMap((client) => Array.isArray(client?.projects) ? client.projects : []);

    return {
        overview: {
            clients: clients.length,
            activeServices: allServices.filter((service) => service && service.status === 'active').length,
            projects: allProjects.length,
            priorityItems: priorities.length,
            overdueItems: overdueItems.length,
        },
        priorityItems: priorities.slice(0, 8),
        overdueItems: overdueItems.slice(0, 8),
        recentClients: clients.slice(0, 5).map((record) => ({
            id: record.id,
            name: record.name || 'Cliente',
            email: record.email || '',
            activeServices: (Array.isArray(record.services) ? record.services : []).filter((service) => service && service.status === 'active').length,
        })),
    };
}