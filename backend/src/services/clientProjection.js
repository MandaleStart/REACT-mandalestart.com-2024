function pickString(value) {
    return typeof value === 'string' ? value : '';
}

export function projectClientRecord(client, email) {
    const clientData = typeof client.data === 'function' ? client.data() : client;
    const services = Array.isArray(clientData.services) ? clientData.services : [];
    const clientEmail = email || pickString(clientData.email);

    return {
        id: client.id,
        name: pickString(clientData.name),
        email: clientEmail,
        phone: pickString(clientData.phone),
        services: services.map((service, index) => ({
            id: pickString(service.id) || `${pickString(service.type) || 'service'}-${index}`,
            type: pickString(service.type),
            title: pickString(service.title),
            name: pickString(service.name),
            cost: pickString(service.cost),
            expiry: pickString(service.expiry),
            status: pickString(service.status),
            details: Array.isArray(service.details)
                ? service.details
                    .filter((detail) => detail && typeof detail === 'object')
                    .map((detail) => ({
                        label: pickString(detail.label),
                        value: pickString(detail.value),
                    }))
                : [],
        })),
        projects: Array.isArray(clientData.projects)
            ? clientData.projects.filter((project) => project && typeof project === 'object').slice(0, 50).map((project, projectIndex) => ({
                id: pickString(project.id) || `project-${projectIndex}`,
                title: pickString(project.title),
                description: pickString(project.description),
                status: pickString(project.status),
                startDate: pickString(project.startDate),
                targetDate: pickString(project.targetDate),
                milestones: Array.isArray(project.milestones)
                    ? project.milestones.filter((milestone) => milestone && typeof milestone === 'object').slice(0, 50).map((milestone, milestoneIndex) => ({
                        id: pickString(milestone.id) || `milestone-${projectIndex}-${milestoneIndex}`,
                        title: pickString(milestone.title),
                        description: pickString(milestone.description),
                        status: pickString(milestone.status),
                        dueDate: pickString(milestone.dueDate),
                    }))
                    : [],
            }))
            : [],
    };
}
