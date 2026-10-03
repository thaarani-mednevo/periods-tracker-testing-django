const KEY = "mednevo.auth";

export interface AuthUser {
  name: string;
  email: string;
}
interface Stored {
  token: string;
  user: AuthUser;
}

export function getAuth(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}
export function saveAuth(token: string, user: AuthUser): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ token, user }));
  } catch {
    /* storage blocked */
  }
}
export function clearAuth(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}
export const getToken = () => getAuth()?.token ?? null;