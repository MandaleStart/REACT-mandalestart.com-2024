import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseReady } from '../../../firebase';
import { getBackendHealth, getClientAccount } from '../../../services/authApi';

export default function useClientAccount() {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [accountPending, setAccountPending] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [healthCheck, setHealthCheck] = useState(0);
  const [accountRetry, setAccountRetry] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getBackendHealth()
      .then((health) => {
        if (!active) return;
        if (health.firebaseReady !== true) {
          setBackendStatus('firebase-unavailable');
        } else if (health.databaseReady !== true) {
          setBackendStatus('database-unavailable');
        } else {
          setBackendStatus(firebaseReady ? 'ready' : 'misconfigured');
        }
      })
      .catch(() => {
        if (active) setBackendStatus('unavailable');
      });

    return () => {
      active = false;
    };
  }, [healthCheck]);

  useEffect(() => {
    if (!auth) {
      setAuthInitialized(true);
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setAuthInitialized(true);
    });
  }, []);

  useEffect(() => {
    let active = true;

    if (!authInitialized || backendStatus === 'checking' || registrationPending) return undefined;

    if (!firebaseUser || backendStatus !== 'ready') {
      setUser(null);
      setClientData(null);
      setError('');
      setLoading(false);
      return undefined;
    }

    const loadAccount = async () => {
      setLoading(true);
      setError('');

      try {
        const idToken = await firebaseUser.getIdToken();
        const account = await getClientAccount(idToken);
        if (!active) return;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: account.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cliente',
        });
        setClientData(account);
        setProfileForm({ name: account.name || '', phone: account.phone || '' });
        setAccountPending(false);
      } catch (accountError) {
        if (!active) return;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cliente',
        });
        setClientData(null);
        setAccountPending(accountError?.status === 404);
        setError(accountError?.message || 'No se pudo cargar la información de tu cuenta.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAccount();
    return () => {
      active = false;
    };
  }, [accountRetry, authInitialized, backendStatus, firebaseUser, registrationPending]);

  return {
    user,
    setUser,
    firebaseUser,
    clientData,
    setClientData,
    profileForm,
    setProfileForm,
    accountPending,
    backendStatus,
    authInitialized,
    registrationPending,
    setRegistrationPending,
    loading,
    setLoading,
    healthCheck,
    setHealthCheck,
    accountRetry,
    setAccountRetry,
    error,
    setError,
  };
}
