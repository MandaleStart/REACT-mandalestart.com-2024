function pickString(value) {
    return typeof value === 'string' ? value : '';
}

export function projectClientRecord(client, email) {
    const clientData = client;
    const clientEmail = email || pickString(clientData.email);

    return {
        id: client.id,
        name: pickString(clientData.name),
        email: clientEmail,
        phone: pickString(clientData.phone),
        company: pickString(clientData.company),
        tax_id: pickString(clientData.tax_id),
        billing_email: pickString(clientData.billing_email),
        billing_address: pickString(clientData.billing_address),
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
