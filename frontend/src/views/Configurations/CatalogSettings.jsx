import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { archiveAdminService, getAdminServices, saveAdminService } from '../../services/adminApi';
import { emptyPublicService } from '../Admin/adminModel';
import AdminConfirmationDialog from '../Admin/components/AdminConfirmationDialog';
import AdminServiceEditor from '../Admin/components/AdminServiceEditor';
import AdminServiceList from '../Admin/components/AdminServiceList';
import '../Admin/admin.css';

const toServiceForm = (service) => ({
    ...emptyPublicService,
    ...service,
    points: Array.isArray(service.points) ? service.points : [],
    includes: Array.isArray(service.includes) ? service.includes : [],
});

export default function CatalogSettings() {
    const [services, setServices] = useState([]);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [service, setService] = useState(emptyPublicService);
    const [baseline, setBaseline] = useState(emptyPublicService);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const confirmationDialogRef = useRef(null);
    const isDirty = JSON.stringify(service) !== JSON.stringify(baseline);

    const fetchCatalog = useCallback(async () => {
        setLoading(true);
        try {
            const catalog = await getAdminServices();
            setServices(catalog);
            setError('');
            return catalog;
        } catch (requestError) {
            setError(requestError.message || 'No se pudo cargar el catálogo público.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    useEffect(() => {
        const dialog = confirmationDialogRef.current;
        if (pendingConfirmation && dialog && !dialog.open) dialog.showModal();
        if (!pendingConfirmation && dialog?.open) dialog.close();
    }, [pendingConfirmation]);

    const loadService = (slug, catalog = services) => {
        setSelectedSlug(slug);
        const selectedService = catalog.find((item) => item.slug === slug);
        const form = selectedService ? toServiceForm(selectedService) : emptyPublicService;
        setService(form);
        setBaseline(form);
        setError('');
        setNotice('');
    };

    const chooseService = (slug) => {
        if (slug === selectedSlug) return;
        if (isDirty) {
            setPendingConfirmation({
                message: 'Hay cambios sin guardar. Si cambiás de servicio, se van a descartar.',
                confirmLabel: 'Descartar y cambiar',
                onConfirm: () => loadService(slug),
            });
            return;
        }
        loadService(slug);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const saved = await saveAdminService(service.slug, {
                ...service,
                points:
                    service.pointsText === undefined
                        ? service.points
                        : service.pointsText.split('\n').map((line) => line.trim()).filter(Boolean),
                includes:
                    service.includesText === undefined
                        ? service.includes
                        : service.includesText.split('\n').map((line) => line.trim()).filter(Boolean),
            });
            const catalog = await fetchCatalog();
            const savedForm = toServiceForm(catalog?.find((item) => item.slug === saved.slug) || saved);
            setSelectedSlug(saved.slug);
            setService(savedForm);
            setBaseline(savedForm);
            setNotice('El catálogo público se actualizó correctamente.');
        } catch (saveError) {
            setError(saveError.message || 'No se pudo guardar el servicio.');
        } finally {
            setBusy(false);
        }
    };

    const handleArchive = () => {
        if (!selectedSlug) return;
        setPendingConfirmation({
            message: '¿Archivar este servicio? Dejará de mostrarse en el sitio público.',
            confirmLabel: 'Archivar servicio',
            onConfirm: async () => {
                setBusy(true);
                setError('');
                setNotice('');
                try {
                    await archiveAdminService(selectedSlug);
                    const catalog = await fetchCatalog();
                    if (catalog) loadService(selectedSlug, catalog);
                    setNotice('El servicio se archivó y dejó de mostrarse en el sitio público.');
                } catch (archiveError) {
                    setError(archiveError.message || 'No se pudo archivar el servicio.');
                } finally {
                    setBusy(false);
                }
            },
        });
    };

    const confirmPendingAction = () => {
        const confirmAction = pendingConfirmation?.onConfirm;
        setPendingConfirmation(null);
        confirmAction?.();
    };

    return (
        <main className="configurations-page">
            <AdminConfirmationDialog
                dialogRef={confirmationDialogRef}
                confirmation={pendingConfirmation}
                onCancel={() => setPendingConfirmation(null)}
                onConfirm={confirmPendingAction}
            />
            <header className="configurations-header">
                <div>
                    <span className="eyebrow">Configuraciones / Sitio público</span>
                    <h1>Catálogo público</h1>
                </div>
                <Link className="secondary-button" to="/configuraciones">
                    Configuraciones
                </Link>
            </header>

            {error && <p className="admin-feedback error" role="alert">{error}</p>}
            {notice && <p className="admin-feedback success" role="status">{notice}</p>}
            {loading ? (
                <p role="status">Cargando catálogo…</p>
            ) : (
                <section className="admin-workspace">
                    <AdminServiceList
                        services={services}
                        selectedSlug={selectedSlug}
                        onSelect={chooseService}
                    />
                    <AdminServiceEditor
                        selectedSlug={selectedSlug}
                        service={service}
                        setService={setService}
                        isDirty={isDirty}
                        busy={busy}
                        sessionExpired={false}
                        onSubmit={handleSubmit}
                        onArchive={handleArchive}
                    />
                </section>
            )}
        </main>
    );
}