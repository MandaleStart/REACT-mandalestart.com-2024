function parseDate(value) {
    if (typeof value !== 'string' || !value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

export function buildClientDashboard(clientRecord) {
    const client = clientRecord && typeof clientRecord === 'object' && typeof clientRecord.data === 'function'
        ? clientRecord.data()
        : clientRecord || {};

    const services = Array.isArray(client.services) ? client.services : [];
    const projects = Array.isArray(client.projects) ? client.projects : [];
    const activeServices = services.filter((service) => service && service.status === 'active');
    const milestones = projects.flatMap((project) => (Array.isArray(project.milestones) ? project.milestones : []).map((milestone) => ({
        projectTitle: project.title || 'Proyecto',
        ...milestone,
    }))).filter((milestone) => milestone && milestone.dueDate && milestone.status !== 'completed');
    milestones.sort((a, b) => {
        const left = parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const right = parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return left - right;
    });

    const alerts = [];
    for (const service of services) {
        const dueDate = parseDate(service.expiry);
        if (!service || !dueDate) continue;
        const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
        if (diffDays <= 30) {
            alerts.push({
                type: 'service-expiry',
                serviceTitle: service.title || service.name || 'Servicio',
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
            upcomingMilestones: milestones.length,
        },
        nextMilestone: milestones[0] ? {
            title: milestones[0].title,
            projectTitle: milestones[0].projectTitle,
            dueDate: milestones[0].dueDate,
            status: milestones[0].status,
        } : null,
        alerts: alerts.slice(0, 5),
        activeServices: activeServices.slice(0, 5),
    };
}

export function buildAdminDashboard(clientRecords) {
    const clients = Array.isArray(clientRecords) ? clientRecords : [];
    const priorities = [];

    for (const client of clients) {
        const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
        const services = Array.isArray(record.services) ? record.services : [];
        const projects = Array.isArray(record.projects) ? record.projects : [];

        for (const service of services) {
            const dueDate = parseDate(service.expiry);
            if (!service || !dueDate) continue;
            const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
            if (service.status === 'active' && diffDays <= 30) {
                priorities.push({
                    kind: 'service-expiry',
                    client: record.name || record.email || 'Cliente',
                    title: service.title || service.name || 'Servicio',
                    dueDate: service.expiry,
                    diffDays,
                });
            }
        }

        for (const project of projects) {
            if (!project || !Array.isArray(project.milestones)) continue;
            for (const milestone of project.milestones) {
                if (!milestone || !milestone.dueDate || milestone.status === 'completed') continue;
                const dueDate = parseDate(milestone.dueDate);
                if (!dueDate) continue;
                const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
                if (diffDays <= 30) {
                    priorities.push({
                        kind: 'milestone',
                        client: record.name || record.email || 'Cliente',
                        project: project.title || 'Proyecto',
                        title: milestone.title || 'Hito',
                        dueDate: milestone.dueDate,
                        diffDays,
                    });
                }
            }
        }
    }

    priorities.sort((a, b) => a.diffDays - b.diffDays);

    const allServices = clients.flatMap((client) => {
        const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
        return Array.isArray(record.services) ? record.services : [];
    });
    const allProjects = clients.flatMap((client) => {
        const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
        return Array.isArray(record.projects) ? record.projects : [];
    });

    return {
        overview: {
            clients: clients.length,
            activeServices: allServices.filter((service) => service && service.status === 'active').length,
            projects: allProjects.length,
            priorityItems: priorities.length,
        },
        priorityItems: priorities.slice(0, 8),
        recentClients: clients.slice(0, 5).map((client) => {
            const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
            return {
                id: record.id || client?.id,
                name: record.name || 'Cliente',
                email: record.email || '',
                activeServices: (Array.isArray(record.services) ? record.services : []).filter((service) => service && service.status === 'active').length,
            };
        }),
    };
}