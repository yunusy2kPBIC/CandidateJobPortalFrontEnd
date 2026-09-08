export const portalRoles = {
  candidate: 'candidate',
  student: 'student',
  administrator: 'admin',
  hrAdministrator: 'hr_admin',
} as const

export type UserRole = typeof portalRoles[keyof typeof portalRoles]

export const recruitmentAdministratorRoles: readonly UserRole[] = [
  portalRoles.administrator,
  portalRoles.hrAdministrator,
]

export const isRecruitmentAdministrator = (role: UserRole | null | undefined) =>
  role === portalRoles.administrator || role === portalRoles.hrAdministrator

export const defaultRouteForRole = (role: UserRole) =>
  role === portalRoles.student
    ? '/cooperative-training'
    : isRecruitmentAdministrator(role) ? '/admin' : '/dashboard'

export const roleLabel = (role: UserRole) => {
  if (role === portalRoles.administrator) return 'Administrator'
  if (role === portalRoles.hrAdministrator) return 'HR Admin'
  if (role === portalRoles.student) return 'Student'
  return 'Candidate'
}
