export function setPublicCache(res) {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
}

export function setPrivateNoStore(res) {
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
}