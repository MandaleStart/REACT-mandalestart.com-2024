import { getDaysFromToday } from './dateUtils.js';

function formatClientDate(value) {
    if (getDaysFromToday(value) === null) return '';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-UY', {
        timeZone: 'America/Montevideo',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export function getClientServiceStatus(subscription, now = new Date()) {
    const { status, renews_on: renewsOn } = subscription;
    const daysUntilRenewal = getDaysFromToday(renewsOn, now);
    if (status === 'active' && daysUntilRenewal !== null) {
        const renewalDate = formatClientDate(renewsOn);
        if (daysUntilRenewal < 0) {
            return {
                label: 'Vencido',
                description: `Venció el ${renewalDate}. Escribime para coordinar la renovación.`,
            };
        }
        if (daysUntilRenewal <= 30) {
            return {
                label: 'Vence pronto',
                description: daysUntilRenewal === 0
                    ? 'Vence hoy. Escribime si querés renovarlo.'
                    : `Vence en ${daysUntilRenewal} días. Escribime si querés renovarlo.`,
            };
        }
    }

    const labels = {
        active: 'Activo',
        pending: 'Pendiente',
        suspended: 'Suspendido',
        cancelled: 'Cancelado',
        expired: 'Vencido',
    };
    const label = labels[status] || 'Sin estado';
    if (status === 'active' && renewsOn) {
        const renewalDate = formatClientDate(renewsOn);
        if (renewalDate) return { label, description: `Próxima renovación: ${renewalDate}.` };
    }
    if (status === 'expired' && renewsOn) {
        const renewalDate = formatClientDate(renewsOn);
        if (renewalDate) {
            return {
                label,
                description: `Venció el ${renewalDate}. Escribime para reactivarlo.`,
            };
        }
    }
    return { label, description: '' };
}

export function getClientAreaGuidance({
    servicesCount = 0,
    alertsCount = 0,
    pendingMilestones = 0,
    nextMilestone = null,
}) {
    if (servicesCount === 0) {
        return {
            title: 'Todavía no tenés servicios contratados',
            description:
                'Tu cuenta está lista. Cuando contrates un servicio, vas a ver acá sus costos, vencimientos y estado.',
            priority: 'info',
        };
    }

    if (alertsCount > 0) {
        const nextStep = nextMilestone
            ? `El próximo paso importante es “${nextMilestone.title}” para ${nextMilestone.projectTitle || 'tu proyecto'}, con fecha ${nextMilestone.dueDate}.`
            : 'Revisá los vencimientos y escribime si necesitás ayuda con una renovación o seguimiento.';

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
        description: 'Tenés tus servicios y entregas en orden. Si necesitás revisar algo, escribime.',
        priority: 'success',
    };
}
