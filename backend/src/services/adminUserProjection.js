export function projectAdminUserRecord(user, clientsByEmail = new Map()) {
    const email = typeof user.email === 'string' ? user.email : '';
    const client = email ? clientsByEmail.get(email.trim().toLocaleLowerCase()) : null;

    return {
        uid: user.uid,
        email,
        displayName: typeof user.displayName === 'string' ? user.displayName : '',
        emailVerified: user.emailVerified === true,
        disabled: user.disabled === true,
        isAdmin: user.customClaims?.admin === true,
        clientId: client?.id || '',
        clientName: typeof client?.name === 'string' ? client.name : '',
    };
}