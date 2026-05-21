import { type User } from '@supabase/supabase-js'
import { env } from '@/config/env'

export type AdminRole = 'superadmin' | 'catalog' | 'operations' | 'content' | 'analyst'

export type AdminSection = 'overview' | 'products' | 'scans' | 'recommendations' | 'access' | 'settings' | 'revenue'

const roleSections: Record<AdminRole, AdminSection[]> = {
  superadmin: ['overview', 'products', 'scans', 'recommendations', 'access', 'settings', 'revenue'],
  catalog: ['overview', 'products', 'recommendations', 'settings', 'revenue'],
  operations: ['overview', 'products', 'scans', 'settings', 'revenue'],
  content: ['overview', 'products', 'recommendations', 'settings'],
  analyst: ['overview', 'scans', 'recommendations', 'settings', 'revenue'],
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

  // Attempt to check local storage roles first for development overrides
  const storedRolesStr = localStorage.getItem('lumina_user_roles')
  if (storedRolesStr) {
    try {
      const list = JSON.parse(storedRolesStr)
      const found = list.find((u: any) => u.email.toLowerCase() === email)
      if (found && found.role) {
        if (found.role === 'user') return null
        return found.role as AdminRole
      }
    } catch {
      // ignore
    }
  }

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
      return 'Quản lý danh mục (Catalog Admin)'
    case 'operations':
      return 'Quản lý vận hành (Operations Admin)'
    case 'content':
      return 'Quản lý nội dung (Content Admin)'
    case 'analyst':
      return 'Chuyên viên phân tích (Analyst)'
    default:
      return 'Quản trị viên (Admin)'
  }
}
