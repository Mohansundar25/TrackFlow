// Fetch wrapper: attaches the access token and transparently refreshes it once on 401.
const API = import.meta.env.VITE_API_URL || '';

let accessToken = null;
let refreshing = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export function refresh() {
  if (!refreshing) {
    refreshing = fetch(`${API}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Session expired');
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function api(path, { method = 'GET', body, retry = true } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry && !path.startsWith('/api/auth')) {
    await refresh();
    return api(path, { method, body, retry: false });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}
