import { type User } from '@supabase/supabase-js'

export type AdminRole = 'admin'

export type AdminSection = 'overview' | 'products' | 'categories' | 'product-configs' | 'scans' | 'recommendations' | 'access' | 'settings' | 'revenue'

const adminSections: AdminSection[] = ['overview', 'products', 'categories', 'product-configs', 'scans', 'recommendations', 'access', 'settings', 'revenue']

function normalizeRole(value?: string | null): AdminRole | null {
  const role = value?.toLowerCase().trim()
  if (!role) return null
  return role === 'admin' ? 'admin' : null
}

export function getAdminRole(user: User | null): AdminRole | null {
  if (!user) return null

  const metadataRole = normalizeRole(
    (user.app_metadata as { role?: string } | undefined)?.role ??
      (user.user_metadata as { role?: string } | undefined)?.role,
  )

  return metadataRole
}

export function isAdminUser(user: User | null) {
  return getAdminRole(user) !== null
}

export function getAdminSections(role: AdminRole | null) {
  if (role !== 'admin') return []
  return adminSections
}

export function canAccessAdminSection(role: AdminRole | null, section: AdminSection) {
  return role === 'admin'
}

export function getAdminRoleLabel(role: AdminRole | null) {
  return role === 'admin' ? 'Admin' : 'User'
}
