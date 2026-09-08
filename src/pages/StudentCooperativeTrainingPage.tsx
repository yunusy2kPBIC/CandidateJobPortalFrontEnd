import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Alert } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import {
  api,
  type CooperativeTrainingPayload,
  type CooperativeTrainingRequest,
  type User,
} from '../services/api'

const universityOptions = [
  'King Saud University',
  'Imam Abdulrahman Bin Faisal University',
  'Taibah University',
  'Prince Sattam Bin Abdulaziz University',
  'University of Jeddah',
]

const majorOptions = [
  'Computer Science',
  'Information Systems',
  'Software Engineering',
  'Business Administration',
  'Human Resources',
  'Finance',
  'Marketing',
]

const cityOptions = ['Riyadh', 'Jeddah', 'Dammam', 'Al Khobar', 'Madinah']

const createInitialForm = (user: User | null): CooperativeTrainingPayload => ({
  first_name: user?.first_name ?? '',
  last_name: user?.last_name ?? '',
  id_number: '',
  mobile_number: user?.phone ? `${user.country_code} ${user.phone}`.trim() : '',
  email: user?.email ?? '',
  gender: user && ['Male', 'Female', 'Other'].includes(user.gender)
    ? user.gender as CooperativeTrainingPayload['gender']
    : 'Male',
  training_duration: 3,
  semester: 'First Semester',
  training_starting_date: '',
  training_supervisor_name: '',
  training_supervisor_number: '',
  training_supervisor_email: '',
  university_college: '',
  qualification: "Bachelor's Degree",
  major: '',
  gpa_scale: 5,
  cumulative_gpa: 0,
  english_level: 'Intermediate',
  desired_city_for_training: user?.city ?? '',
  current_city_of_residency: user?.city ?? '',
  disability: false,
  declaration_accepted: false,
})

export default function StudentCooperativeTrainingPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<CooperativeTrainingPayload>(() => createInitialForm(user))
  const [request, setRequest] = useState<CooperativeTrainingRequest | null>(null)
  const [transcript, setTranscript] = useState<File | null>(null)
  const [universityRequest, setUniversityRequest] = useState<File | null>(null)
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setForm((current) => ({
      ...current,
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      mobile_number: current.mobile_number || (user?.phone ? `${user.country_code} ${user.phone}`.trim() : ''),
      desired_city_for_training: current.desired_city_for_training || user?.city || '',
      current_city_of_residency: current.current_city_of_residency || user?.city || '',
    }))
  }, [user])

  useEffect(() => {
    let active = true
    api.studentCooperativeTrainingStatus()
      .then(({ request: existing }) => { if (active) setRequest(existing) })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load your cooperative training request')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!eligibilityConfirmed) {
      setError('Confirm that you meet the cooperative training eligibility requirements.')
      return
    }
    if (!transcript || !universityRequest) {
      setError('Upload both your transcript and the official university training request.')
      return
    }
    if (form.cumulative_gpa > form.gpa_scale) {
      setError(`Cumulative GPA cannot be higher than ${form.gpa_scale}.`)
      return
    }
    setSubmitting(true)
    try {
      const created = await api.submitStudentCooperativeTraining(form, transcript, universityRequest)
      setRequest(created)
      setNotice('Your cooperative training request was submitted successfully.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit your cooperative training request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page-loader"><span className="loader" /></div>

  return (
    <div className="page-container student-training-page">
      <PageHeader
        title="Cooperative Training"
        subtitle="Submit your university cooperative training request and supporting documents."
      />
      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="success" message={notice} />}

      {request ? <SubmittedRequest request={request} /> : <>
        <section className="panel student-training-requirements">
          <div className="form-section-heading"><span><ShieldCheck /></span><div><h2>Before you apply</h2><p>Confirm that the program is suitable for your academic requirement.</p></div></div>
          <div className="student-requirement-grid">
            <span><CheckCircle2 />Saudi national and currently an undergraduate student</span>
            <span><CalendarDays />Available for a training period of three to six months</span>
            <span><FileCheck2 />Official university training request is available</span>
            <span><GraduationCap />Current transcript and academic information are ready</span>
          </div>
        </section>

        <form className="panel admin-job-form cooperative-training-form student-training-form" onSubmit={submit}>
          <div className="panel-heading"><div><h2>Student application</h2><p>Your account name and email are attached automatically to this request.</p></div></div>
          <div className="admin-job-fields cooperative-training-fields">
            <label>First name<input required readOnly value={form.first_name} /></label>
            <label>Last name<input required readOnly value={form.last_name} /></label>
            <label>ID number<input required inputMode="numeric" minLength={7} maxLength={20} pattern="[1-9][0-9]{6,19}" title="Enter 7-20 digits; the first digit cannot be zero" value={form.id_number} onChange={(event) => setForm({ ...form, id_number: event.target.value })} /></label>
            <label>Mobile number<input required type="tel" minLength={7} maxLength={40} value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value })} /></label>
            <label>Email<input required readOnly type="email" value={form.email} /></label>
            <label>Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as CooperativeTrainingPayload['gender'] })}><option>Male</option><option>Female</option><option>Other</option></select></label>
            <label>Training duration<select value={form.training_duration} onChange={(event) => setForm({ ...form, training_duration: Number(event.target.value) })}><option value={3}>3 months</option><option value={4}>4 months</option><option value={5}>5 months</option><option value={6}>6 months</option></select></label>
            <label>Semester<select value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value as CooperativeTrainingPayload['semester'] })}><option>First Semester</option><option>Second Semester</option><option>Summer Semester</option></select></label>
            <label>Training starting date<input required type="date" value={form.training_starting_date} onChange={(event) => setForm({ ...form, training_starting_date: event.target.value })} /></label>
            <label>Training supervisor name<input required maxLength={180} value={form.training_supervisor_name} onChange={(event) => setForm({ ...form, training_supervisor_name: event.target.value })} /></label>
            <label>Training supervisor number<input required type="tel" minLength={7} maxLength={40} value={form.training_supervisor_number} onChange={(event) => setForm({ ...form, training_supervisor_number: event.target.value })} /></label>
            <label>Training supervisor email<input required type="email" maxLength={255} value={form.training_supervisor_email} onChange={(event) => setForm({ ...form, training_supervisor_email: event.target.value })} /></label>
            <label>University / college<select required value={form.university_college} onChange={(event) => setForm({ ...form, university_college: event.target.value })}><option value="" disabled>Select university or college</option>{universityOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Qualification<select value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value as CooperativeTrainingPayload['qualification'] })}><option>Diploma</option><option>Bachelor's Degree</option><option>Master's Degree</option></select></label>
            <label>Major<select required value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })}><option value="" disabled>Select major</option>{majorOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>GPA scale<select value={form.gpa_scale} onChange={(event) => setForm({ ...form, gpa_scale: Number(event.target.value) as 4 | 5 })}><option value={4}>4</option><option value={5}>5</option></select></label>
            <label>Cumulative GPA<input required type="number" min={0} max={form.gpa_scale} step="0.01" value={form.cumulative_gpa} onChange={(event) => setForm({ ...form, cumulative_gpa: Number(event.target.value) })} /></label>
            <label>English level<select value={form.english_level} onChange={(event) => setForm({ ...form, english_level: event.target.value as CooperativeTrainingPayload['english_level'] })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Fluent</option></select></label>
            <label>Desired training city<select required value={form.desired_city_for_training} onChange={(event) => setForm({ ...form, desired_city_for_training: event.target.value })}><option value="" disabled>Select city</option>{cityOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Current city<select required value={form.current_city_of_residency} onChange={(event) => setForm({ ...form, current_city_of_residency: event.target.value })}><option value="" disabled>Select city</option>{cityOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Disability?<select value={form.disability ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, disability: event.target.value === 'yes' })}><option value="no">No</option><option value="yes">Yes</option></select></label>
            <label className="training-document-field">University / college transcript<input required type="file" accept=".pdf,.doc,.docx" onChange={(event) => setTranscript(event.target.files?.[0] ?? null)} /><small>PDF, DOC, or DOCX; maximum 10 MB.</small></label>
            <label className="training-document-field">Official university training request<input required type="file" accept=".pdf,.doc,.docx" onChange={(event) => setUniversityRequest(event.target.files?.[0] ?? null)} /><small>PDF, DOC, or DOCX; maximum 10 MB.</small></label>
            <label className="checkbox-label admin-job-wide training-declaration"><input required type="checkbox" checked={eligibilityConfirmed} onChange={(event) => setEligibilityConfirmed(event.target.checked)} /><span>I confirm that I meet the eligibility requirements shown above.</span></label>
            <label className="checkbox-label admin-job-wide training-declaration"><input required type="checkbox" checked={form.declaration_accepted} onChange={(event) => setForm({ ...form, declaration_accepted: event.target.checked })} /><span>I confirm that all information and documents are accurate.</span></label>
          </div>
          <div className="admin-form-actions"><button className="button button-primary" disabled={submitting}><Save size={17} />{submitting ? 'Submitting...' : 'Submit application'}</button></div>
        </form>
      </>}
    </div>
  )
}

function SubmittedRequest({ request }: { request: CooperativeTrainingRequest }) {
  return <section className="panel student-training-submitted">
    <div className="student-submission-icon"><CheckCircle2 /></div>
    <div className="student-submission-copy">
      <span className="eyebrow">Application submitted</span>
      <h2>Your cooperative training request has been received</h2>
      <p>HR will review your information and contact you using <strong>{request.email}</strong>. Contact HR if any submitted information needs to be corrected.</p>
      <div className="student-submission-details">
        <span><small>Reference</small><strong>CT-{request.id}</strong></span>
        <span><small>Submitted</small><strong>{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recorded'}</strong></span>
        <span><small>Training period</small><strong>{request.training_duration} months</strong></span>
        <span><small>Preferred city</small><strong>{request.desired_city_for_training}</strong></span>
        <span><small>University</small><strong>{request.university_college}</strong></span>
        <span><small>Major</small><strong>{request.major}</strong></span>
      </div>
      <div className="student-submission-documents">
        <strong>Supporting documents</strong>
        {request.transcript_url ? <a href={request.transcript_url} target="_blank" rel="noreferrer"><FileText size={15} />{request.transcript_name || 'Transcript'}<ExternalLink size={13} /></a> : <span><FileText size={15} />{request.transcript_name || 'Transcript uploaded'}</span>}
        {request.university_request_url ? <a href={request.university_request_url} target="_blank" rel="noreferrer"><FileText size={15} />{request.university_request_name || 'University request'}<ExternalLink size={13} /></a> : <span><FileText size={15} />{request.university_request_name || 'University request uploaded'}</span>}
      </div>
    </div>
  </section>
}
