export function getClientAreaGuidance({
    servicesCount = 0,
    alertsCount = 0,
    pendingMilestones = 0,
    nextMilestone = null,
}) {
    if (servicesCount === 0) {
        return {
            title: 'Todavía no tenés servicios asociados',
            description:
                'Tu cuenta está lista para empezar. Cuando se asocie un servicio, aparecerá aquí con costos, fechas y el estado de tu proyecto.',
            priority: 'info',
        };
    }

    if (alertsCount > 0) {
        const nextStep = nextMilestone
            ? `El próximo paso importante es “${nextMilestone.title}” para ${nextMilestone.projectTitle || 'tu proyecto'}, con fecha ${nextMilestone.dueDate}.`
            : 'Revisá los vencimientos y contactanos si necesitás ayuda con una renovación o seguimiento.';

        return {
            title: `Hay ${alertsCount} servicio${alertsCount === 1 ? '' : 's'} por revisar`,
            description: nextStep,
            priority: 'attention',
        };
    }

    if (pendingMilestones > 0) {
        const nextStep = nextMilestone
            ? `La próxima entrega es “${nextMilestone.title}” y está programada para ${nextMilestone.dueDate}.`
            : 'Ningún servicio está vencido, pero todavía tenés entregas pendientes por confirmar.';

        return {
            title: 'Tenés entregas pendientes',
            description: nextStep,
            priority: 'info',
        };
    }

    return {
        title: 'Todo está bajo control',
        description: 'Tenés tus servicios y entregas en orden. Si necesitás revisar un detalle, podemos ayudarte enseguida.',
        priority: 'success',
    };
}
