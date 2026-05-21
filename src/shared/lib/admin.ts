import { type User } from '@supabase/supabase-js'
import { env } from '@/config/env'

export type AdminRole = 'superadmin' | 'catalog' | 'operations' | 'content' | 'analyst'

export type AdminSection = 'overview' | 'products' | 'scans' | 'recommendations' | 'access' | 'settings'

const roleSections: Record<AdminRole, AdminSection[]> = {
  superadmin: ['overview', 'products', 'scans', 'recommendations', 'access', 'settings'],
  catalog: ['overview', 'products', 'recommendations', 'settings'],
  operations: ['overview', 'products', 'scans', 'settings'],
  content: ['overview', 'products', 'recommendations', 'settings'],
  analyst: ['overview', 'scans', 'recommendations', 'settings'],
}

function normalizeRole(value?: string | null): AdminRole | null {
  const role = value?.toLowerCase().trim()

  if (!role) return null
  if (role === 'admin' || role === 'superadmin') return 'superadmin'
  if (role === 'catalog' || role === 'merchandiser') return 'catalog'
  if (role === 'operations' || role === 'ops') return 'operations'
  if (role === 'content') return 'content'
  if (role === 'analyst' || role === 'analytics') return 'analyst'

  return null
}

export function getAdminRole(user: User | null): AdminRole | null {
  if (!user) return null

  const email = user.email?.toLowerCase() ?? ''
  const metadataRole = normalizeRole(
    (user.app_metadata as { role?: string } | undefined)?.role ??
      (user.user_metadata as { role?: string } | undefined)?.role,
  )

  if (metadataRole) return metadataRole
  if (env.adminEmails.includes(email) || email.includes('admin')) return 'superadmin'

  return null
}

export function isAdminUser(user: User | null) {
  return getAdminRole(user) !== null
}

export function getAdminSections(role: AdminRole | null) {
  if (!role) return []
  return roleSections[role]
}

export function canAccessAdminSection(role: AdminRole | null, section: AdminSection) {
  if (!role) return false
  return roleSections[role].includes(section)
}

export function getAdminRoleLabel(role: AdminRole | null) {
  switch (role) {
    case 'superadmin':
      return 'Super Admin'
    case 'catalog':
      return 'Catalog Admin'
    case 'operations':
      return 'Operations Admin'
    case 'content':
      return 'Content Admin'
    case 'analyst':
      return 'Analyst'
    default:
      return 'Admin'
  }
}
