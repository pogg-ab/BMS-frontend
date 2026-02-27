import React from 'react'
import { getPermissions } from '../utils/jwt'

type Props = { permission: string; fallback?: React.ReactNode; children: React.ReactNode }

export default function PermissionGate({ permission, fallback = null, children }: Props) {
  const perms = getPermissions();
  return perms.includes(permission) ? <>{children}</> : <>{fallback}</>;
}
