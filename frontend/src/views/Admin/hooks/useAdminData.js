import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseReady } from '../../../firebase';
import {
  getAdminClients,
  getAdminDashboard,
  getAdminServices,
  getAdminUsers,
} from '../../../services/adminApi';
import { expiredSessionMessage, isSessionError } from '../adminModel';

export default function useAdminData() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [access, setAccess] = useState('checking');
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [services, setServices] = useState([]);
  const [dashboard, setDashboard] = useState({
    overview: { clients: 0, activeServices: 0, projects: 0, priorityItems: 0 },
    priorityItems: [],
    recentClients: [],
  });
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setAccess('misconfigured');
      return undefined;
    }

    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
  }, []);

  const refreshData = useCallback(async () => {
    const [clientList, serviceList, adminDashboard] = await Promise.all([
      getAdminClients(),
      getAdminServices(),
      getAdminDashboard(),
    ]);
    setClients(clientList);
    setServices(serviceList);
    setDashboard(adminDashboard || {
      overview: { clients: 0, activeServices: 0, projects: 0, priorityItems: 0 },
      priorityItems: [],
      recentClients: [],
    });
    try {
      setUsers(await getAdminUsers());
      setUsersError('');
    } catch (requestError) {
      setUsers([]);
      setUsersError(requestError.message || 'No se pudieron cargar las cuentas de usuario.');
    }
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    if (!firebaseReady) {
      setAccess('misconfigured');
      return undefined;
    }
    if (!firebaseUser) {
      setAccess('signed-out');
      return undefined;
    }

    let active = true;
    setAccess('checking');
    setError('');
    setSessionExpired(false);

    firebaseUser
      .getIdTokenResult(true)
      .then(async (tokenResult) => {
        if (!active) return;
        // This claim only controls frontend visibility; every admin endpoint must enforce authorization server-side and verify revocation.
        if (tokenResult.claims.admin !== true) {
          setAccess('forbidden');
          return;
        }
        await refreshData();
        if (active) setAccess('allowed');
      })
      .catch((requestError) => {
        if (!active) return;
        const sessionError = isSessionError(requestError);
        if (requestError.status === 403) {
          setAccess('forbidden');
          setError('Tu cuenta no tiene permisos para acceder a esta sección.');
          return;
        }
        setSessionExpired(sessionError);
        setError(
          sessionError
            ? expiredSessionMessage
            : requestError.message || 'No se pudo cargar el panel administrativo.',
        );
        setAccess(sessionError ? 'signed-out' : 'error');
      });

    return () => {
      active = false;
    };
  }, [authReady, firebaseUser, refreshData]);

  return {
    firebaseUser,
    authReady,
    access,
    setAccess,
    clients,
    users,
    usersError,
    services,
    error,
    setError,
    sessionExpired,
    setSessionExpired,
    refreshData,
    dashboard,
  };
}
