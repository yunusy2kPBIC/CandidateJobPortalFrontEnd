import type { UserRole } from '../auth/roles'

export type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  country_code: string
  phone: string
  country: string
  nationality: string
  gender: string
  city: string
  title: string
  about: string
  role: UserRole
  is_email_verified: boolean
  resume_name: string | null
  created_at: string
}

export type ExternalAuthProvider = 'google' | 'microsoft'

export type ExternalAuthProviders = {
  google: boolean
  microsoft: boolean
}

export type AuthResult = {
  access_token: string
  user: User
}

export type RegistrationPending = {
  email: string
  expires_at: string
  resend_available_at: string
  dev_verification_code: string | null
}

export type PasswordRecoveryPending = {
  message: string
  email: string
  expires_at: string
  resend_available_at: string
  dev_reset_code: string | null
}

export type PrivacyNotice = {
  title: string
  version: string
  effective_date: string
  contact_email: string
  sections: { title: string; content: string }[]
}

export type ConsentEvidence = {
  document_type: string
  document_version: string
  accepted_at: string
  ip_address: string
  user_agent: string
}

export type Job = {
  id: number
  title: string
  division: string
  country: string
  city: string
  job_function: string
  career_level: string
  employment_type: string
  summary: string
  description: string
  requirements: string
  is_open: boolean
  is_published: boolean
  is_featured: boolean
  posted_at: string
  expires_at: string | null
}

export type Application = {
  id: number
  application_code: string
  status: string
  applied_at: string
  job: Job
}

export type Dashboard = {
  applications: number
  interviews: number
  open_jobs: number
  profile_complete: number
  recent_activity: { label: string; date: string }[]
}

export type JobFilters = {
  countries: string[]
  cities: string[]
  divisions: string[]
  job_functions: string[]
  career_levels: string[]
}

export type LookupCountry = {
  name: string
  cities: string[]
}

export type LookupOptions = {
  countries: LookupCountry[]
  residence_countries: string[]
  nationalities: string[]
  divisions: string[]
  job_functions: string[]
  career_levels: string[]
}

export type JobList = {
  items: Job[]
  total: number
  filters: JobFilters
}

export type RegisterPayload = {
  email: string
  confirm_email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
  country_code: string
  phone: string
  country: string
  nationality: string
  gender: string
  is_student: boolean
  accepted_terms: boolean
  privacy_version: string
}

export type Notification = {
  id: number
  kind: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export type Preferences = {
  email_updates: boolean
  job_alerts: boolean
  marketing: boolean
  language: 'English' | 'Arabic'
  theme: 'light' | 'dark'
  updated_at: string
}

export type PreferenceUpdate = Omit<Preferences, 'updated_at'>

export type AdminSummary = {
  users: number
  candidates: number
  admins: number
  open_jobs: number
  applications: number
}

export type AdminJobOptions = {
  countries: string[]
  cities: string[]
  cities_by_country: Record<string, string[]>
  nationalities: string[]
  divisions: string[]
  job_functions: string[]
  career_levels: AdminJobPayload['career_level'][]
}

export type AdminCandidate = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  country: string
  nationality: string
  gender: string
  city: string
  title: string
  resume_name: string | null
  resume_url: string | null
  application_count: number
  created_at: string
}

export type AdminApplication = {
  id: number
  application_code: string
  status: 'Under Review' | 'Interview' | 'Shortlisted' | 'Rejected' | 'Hired' | 'Withdrawn'
  applied_at: string
  candidate: AdminCandidate
  job: Job
}

export type AdminJobPayload = {
  title: string
  division: string
  country: string
  city: string
  job_function: string
  career_level: 'Entry level' | 'Mid-level' | 'Senior'
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote'
  summary: string
  description: string
  requirements: string
  is_open: boolean
  is_published: boolean
  is_featured: boolean
  posted_at: string
  expires_at: string
}

export type AdminAuditLog = {
  id: number
  action: string
  entity_type: string
  entity_id: string | null
  details: string
  created_at: string
  admin_user_id: number
  admin_name: string
  admin_email: string
}

export type RecruitmentRequestPayload = {
  preferred_position: string
  name: string
  nationality: string
  gender: 'Male' | 'Female' | 'Other'
  driver_license_type: 'Saudi License' | 'Valid GCC License' | 'Other License' | 'None'
  mobile_number: string
  email_address: string
  iqama_number: string
  iqama_profession: string
  current_employer: string
  date_of_birth: string
  city: string
  accept_work_in_another_city: boolean
  qualification: 'High School' | 'Diploma' | "Bachelor's Degree" | "Master's Degree" | 'Doctorate' | 'Other'
  current_salary: number
  comments: string
}

export type RecruitmentRequest = RecruitmentRequestPayload & {
  id: string
  web_url: string | null
  created_at: string | null
  updated_at: string | null
}

export type CooperativeTrainingPayload = {
  first_name: string
  last_name: string
  id_number: string
  mobile_number: string
  email: string
  gender: 'Male' | 'Female' | 'Other'
  training_duration: number
  semester: 'First Semester' | 'Second Semester' | 'Summer Semester'
  training_starting_date: string
  training_supervisor_name: string
  training_supervisor_number: string
  training_supervisor_email: string
  university_college: string
  qualification: 'High School' | 'Diploma' | "Bachelor's Degree" | "Master's Degree" | 'Doctorate' | 'Other'
  major: string
  gpa_scale: 4 | 5
  cumulative_gpa: number
  english_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent'
  desired_city_for_training: string
  current_city_of_residency: string
  disability: boolean
  declaration_accepted: boolean
}

export type CooperativeTrainingRequest = CooperativeTrainingPayload & {
  id: string
  web_url: string | null
  created_at: string | null
  updated_at: string | null
  transcript_url: string | null
  transcript_name: string | null
  university_request_url: string | null
  university_request_name: string | null
}

export type StudentCooperativeTrainingStatus = {
  request: CooperativeTrainingRequest | null
}

export type SharePointStatus = {
  configured: boolean
  site_url: string | null
  site_id_configured: boolean
  portal_sync_enabled: boolean
  storage_provider: string
  lists: {
    candidates: string
    jobs: string
    applications: string
    recruitment_requests: string
    cooperative_training: string
    cooperative_training_documents: string
    resumes: string
  }
}

export type SharePointSyncResult = {
  message: string
  candidates: number
  jobs: number
  applications: number
  resumes_uploaded: number
}

export type SharePointDiagnostics = {
  configured: boolean
  site_url: string | null
  configured_tenant_id: string | null
  configured_client_id: string | null
  token: {
    acquired: boolean
    tenant_id: string | null
    application_id: string | null
    audience: string | null
    application_roles: string[]
    error?: string
    claims_error?: string
  }
  site_access: {
    ok: boolean
    site_id: string | null
    error: string | null
  }
}

export type SharePointList = {
  id: string
  display_name: string | null
  name: string | null
  web_url: string | null
  template: string | null
}

export type SharePointItem = {
  id: string
  web_url: string | null
  created_at: string | null
  updated_at: string | null
  fields: Record<string, unknown>
}

export type SharePointSetupResult = {
  site_id: string
  site_url: string | null
  resources: Array<SharePointList & { status: 'created' | 'existing' }>
}

export type SharePointCandidatePayload = {
  candidate_name?: string
  email: string
  first_name: string
  last_name: string
  country_code: string
  phone: string
  country: string
  nationality?: string
  gender?: string
  city: string
  professional_title: string
  about: string
  role: 'Candidate' | 'Student' | 'HR Admin' | 'Admin'
}

export type SharePointJobPayload = {
  job_title: string
  division: string
  country: string
  city: string
  job_function: string
  career_level: 'Entry level' | 'Mid-level' | 'Senior'
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote'
  summary: string
  description: string
  requirements: string
  is_open: boolean
  is_featured: boolean
  posted_at?: string
  expires_at?: string
}

export type SharePointApplicationPayload = {
  application_code?: string
  candidate_id: number
  job_id: number
  status: 'Under Review' | 'Interview' | 'Shortlisted' | 'Rejected' | 'Hired' | 'Withdrawn'
  applied_at?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('candidate_portal_token')
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const body = await response.json()
      message = typeof body.detail === 'string' ? body.detail : message
    } catch {
      message = response.statusText || message
    }
    throw new ApiError(message, response.status)
  }
  return response.json() as Promise<T>
}

async function requestBlob(path: string): Promise<Blob> {
  const token = localStorage.getItem('candidate_portal_token')
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { headers })
  if (!response.ok) {
    let message = 'Unable to open the CV. Please try again.'
    try {
      const body = await response.json()
      message = typeof body.detail === 'string' ? body.detail : message
    } catch {
      message = response.statusText || message
    }
    throw new ApiError(message, response.status)
  }
  return response.blob()
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: RegisterPayload) =>
    request<RegistrationPending>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  emailAvailability: (email: string) =>
    request<{ available: boolean; pending_verification: boolean }>('/api/auth/email-availability', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyEmail: (email: string, code: string) =>
    request<AuthResult>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  resendVerification: (email: string) =>
    request<RegistrationPending>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  requestPasswordRecovery: (email: string) =>
    request<PasswordRecoveryPending>('/api/auth/password-recovery/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (email: string, code: string, newPassword: string, confirmPassword: string) =>
    request<{ message: string }>('/api/auth/password-recovery/reset', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }),
  privacyNotice: () => request<PrivacyNotice>('/api/privacy'),
  privacyConsent: () => request<ConsentEvidence>('/api/privacy/consent'),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  externalAuthProviders: () => request<ExternalAuthProviders>('/api/auth/external/providers'),
  externalLoginUrl: (provider: ExternalAuthProvider, returnUrl: string) =>
    `${API_URL}/api/auth/external/${provider}?return_url=${encodeURIComponent(returnUrl)}`,
  exchangeExternalAuthCode: (code: string) =>
    request<AuthResult>('/api/auth/external/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  me: () => request<User>('/api/auth/me'),
  lookups: () => request<LookupOptions>('/api/lookups'),
  dashboard: () => request<Dashboard>('/api/dashboard'),
  jobs: (params: URLSearchParams) => request<JobList>(`/api/jobs?${params.toString()}`),
  job: (id: number) => request<Job>(`/api/jobs/${id}`),
  apply: (id: number) => request<{ message: string }>(`/api/jobs/${id}/apply`, { method: 'POST' }),
  applications: () => request<Application[]>('/api/applications'),
  updateProfile: (payload: Omit<User, 'id' | 'email' | 'role' | 'is_email_verified' | 'resume_name' | 'created_at'>) =>
    request<User>('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadResume: (file: File) => {
    const form = new FormData()
    form.append('resume', file)
    return request<{ message: string }>('/api/profile/resume', { method: 'POST', body: form })
  },
  updatePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    request<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }),
  notifications: () => request<Notification[]>('/api/notifications'),
  unreadNotificationCount: () => request<{ unread: number }>('/api/notifications/unread-count'),
  markNotificationRead: (id: number) =>
    request<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ message: string }>('/api/notifications/read-all', { method: 'POST' }),
  preferences: () => request<Preferences>('/api/preferences'),
  updatePreferences: (payload: PreferenceUpdate) =>
    request<Preferences>('/api/preferences', { method: 'PUT', body: JSON.stringify(payload) }),
  adminSummary: () => request<AdminSummary>('/api/admin/summary'),
  adminJobs: () => request<Job[]>('/api/admin/jobs'),
  adminJobOptions: () => request<AdminJobOptions>('/api/admin/job-options'),
  adminAuditLogs: () => request<AdminAuditLog[]>('/api/admin/audit-logs'),
  createAdminJob: (payload: AdminJobPayload) =>
    request<Job>('/api/admin/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  updateAdminJob: (id: number, payload: Partial<AdminJobPayload>) =>
    request<Job>(`/api/admin/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteAdminJob: (id: number) =>
    request<{ message: string }>(`/api/admin/jobs/${id}`, { method: 'DELETE' }),
  adminCandidates: () => request<AdminCandidate[]>('/api/admin/candidates'),
  adminCandidateResume: (id: number) => requestBlob(`/api/admin/candidates/${id}/resume`),
  adminApplications: (status = '') =>
    request<AdminApplication[]>(`/api/admin/applications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  updateAdminApplicationStatus: (id: number, status: AdminApplication['status']) =>
    request<AdminApplication>(`/api/admin/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  recruitmentRequests: () => request<RecruitmentRequest[]>('/api/sharepoint/recruitment-requests'),
  createRecruitmentRequest: (payload: RecruitmentRequestPayload) =>
    request<RecruitmentRequest>('/api/sharepoint/recruitment-requests', { method: 'POST', body: JSON.stringify(payload) }),
  updateRecruitmentRequest: (id: string, payload: Partial<RecruitmentRequestPayload>) =>
    request<RecruitmentRequest>(`/api/sharepoint/recruitment-requests/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteRecruitmentRequest: (id: string) =>
    request<{ message: string }>(`/api/sharepoint/recruitment-requests/${id}`, { method: 'DELETE' }),
  cooperativeTrainingRequests: () =>
    request<CooperativeTrainingRequest[]>('/api/sharepoint/cooperative-training-requests'),
  createCooperativeTrainingRequest: (
    payload: CooperativeTrainingPayload,
    transcript: File,
    universityRequest: File,
  ) => {
    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    form.append('transcript', transcript)
    form.append('university_request', universityRequest)
    return request<CooperativeTrainingRequest>('/api/sharepoint/cooperative-training-requests', {
      method: 'POST',
      body: form,
    })
  },
  updateCooperativeTrainingRequest: (id: string, payload: Partial<CooperativeTrainingPayload>) =>
    request<CooperativeTrainingRequest>(`/api/sharepoint/cooperative-training-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  replaceCooperativeTrainingDocument: (
    id: string,
    documentType: 'Transcript' | 'University Request',
    document: File,
  ) => {
    const form = new FormData()
    form.append('document_type', documentType)
    form.append('document', document)
    return request<CooperativeTrainingRequest>(`/api/sharepoint/cooperative-training-requests/${id}/documents`, {
      method: 'POST',
      body: form,
    })
  },
  deleteCooperativeTrainingRequest: (id: string) =>
    request<{ message: string }>(`/api/sharepoint/cooperative-training-requests/${id}`, { method: 'DELETE' }),
  studentCooperativeTrainingStatus: () =>
    request<StudentCooperativeTrainingStatus>('/api/student/cooperative-training'),
  submitStudentCooperativeTraining: (
    payload: CooperativeTrainingPayload,
    transcript: File,
    universityRequest: File,
  ) => {
    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    form.append('transcript', transcript)
    form.append('university_request', universityRequest)
    return request<CooperativeTrainingRequest>('/api/student/cooperative-training', {
      method: 'POST',
      body: form,
    })
  },
  sharepointStatus: () => request<SharePointStatus>('/api/sharepoint/status'),
  sharepointDiagnostics: () => request<SharePointDiagnostics>('/api/sharepoint/diagnostics'),
  sharepointLists: () => request<SharePointList[]>('/api/sharepoint/lists'),
  setupSharepoint: () => request<SharePointSetupResult>('/api/sharepoint/setup', { method: 'POST' }),
  syncPortalToSharepoint: () => request<SharePointSyncResult>('/api/sharepoint/sync', { method: 'POST' }),
  sharepointCandidates: () => request<SharePointItem[]>('/api/sharepoint/candidates'),
  sharepointCandidate: (id: number) => request<SharePointItem>(`/api/sharepoint/candidates/${id}`),
  createSharepointCandidate: (payload: SharePointCandidatePayload) =>
    request<SharePointItem>('/api/sharepoint/candidates', { method: 'POST', body: JSON.stringify(payload) }),
  updateSharepointCandidate: (id: number, payload: Partial<SharePointCandidatePayload>) =>
    request<SharePointItem>(`/api/sharepoint/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSharepointCandidate: (id: number) =>
    request<{ message: string }>(`/api/sharepoint/candidates/${id}`, { method: 'DELETE' }),
  sharepointJobs: () => request<SharePointItem[]>('/api/sharepoint/jobs'),
  sharepointJob: (id: number) => request<SharePointItem>(`/api/sharepoint/jobs/${id}`),
  createSharepointJob: (payload: SharePointJobPayload) =>
    request<SharePointItem>('/api/sharepoint/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  updateSharepointJob: (id: number, payload: Partial<SharePointJobPayload>) =>
    request<SharePointItem>(`/api/sharepoint/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSharepointJob: (id: number) =>
    request<{ message: string }>(`/api/sharepoint/jobs/${id}`, { method: 'DELETE' }),
  sharepointApplications: () => request<SharePointItem[]>('/api/sharepoint/applications'),
  sharepointApplication: (id: number) => request<SharePointItem>(`/api/sharepoint/applications/${id}`),
  createSharepointApplication: (payload: SharePointApplicationPayload) =>
    request<SharePointItem>('/api/sharepoint/applications', { method: 'POST', body: JSON.stringify(payload) }),
  updateSharepointApplication: (id: number, payload: Pick<Partial<SharePointApplicationPayload>, 'application_code' | 'status' | 'applied_at'>) =>
    request<SharePointItem>(`/api/sharepoint/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSharepointApplication: (id: number) =>
    request<{ message: string }>(`/api/sharepoint/applications/${id}`, { method: 'DELETE' }),
  sharepointResumes: () => request<SharePointItem[]>('/api/sharepoint/resumes'),
  uploadSharepointResume: (candidateItemId: number, candidateEmail: string, file: File) => {
    const form = new FormData()
    form.append('candidate_item_id', String(candidateItemId))
    form.append('candidate_email', candidateEmail)
    form.append('resume', file)
    return request<SharePointItem>('/api/sharepoint/resumes', { method: 'POST', body: form })
  },
  deleteSharepointResume: (id: number) =>
    request<{ message: string }>(`/api/sharepoint/resumes/${id}`, { method: 'DELETE' }),
}
