import jwt_decode from 'jwt-decode';

export function decodeToken(token: string | null) {
  if (!token) return null;
  try {
    return jwt_decode<any>(token);
  } catch {
    return null;
  }
}

export function getPermissions(): string[] {
  const t = localStorage.getItem('token');
  const p = decodeToken(t);
  return p?.permissions || p?.roles || [];
}

export function getRoles(): string[] {
  const t = localStorage.getItem('token');
  const p = decodeToken(t);
  return p?.roles || [];
}
