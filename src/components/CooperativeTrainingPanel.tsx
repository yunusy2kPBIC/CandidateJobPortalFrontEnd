import {
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  api,
  type CooperativeTrainingPayload,
  type CooperativeTrainingRequest,
} from '../services/api'
import { Alert, EmptyState } from './Feedback'

type Props = {
  refreshKey?: number
  onCountChange?: (count: number) => void
  onChanged?: () => void
}

const emptyTrainingRequest: CooperativeTrainingPayload = {
  first_name: '',
  last_name: '',
  id_number: '',
  mobile_number: '966',
  email: '',
  gender: 'Male',
  training_duration: 1,
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
  desired_city_for_training: 'Riyadh',
  current_city_of_residency: 'Riyadh',
  disability: false,
  declaration_accepted: false,
}

const universityOptions = [
  'King Saud University',
  'Imam Abdulrahman Bin Faisal University',
  'Taibah University',
  'Prince Sattam Bin Abdulaziz University',
  'University of Jeddah',
]
const majorOptions = [
  'Information Systems',
  'Computer Science',
  'Cybersecurity',
  'Software Engineering',
  'Information Technology',
]
const cityOptions = ['Riyadh', 'Jeddah', 'Dammam', 'Al Khobar', 'Madinah', 'Other']

function toPayload(request: CooperativeTrainingRequest): CooperativeTrainingPayload {
  return {
    first_name: request.first_name,
    last_name: request.last_name,
    id_number: request.id_number,
    mobile_number: request.mobile_number,
    email: request.email,
    gender: request.gender,
    training_duration: request.training_duration,
    semester: request.semester,
    training_starting_date: request.training_starting_date,
    training_supervisor_name: request.training_supervisor_name,
    training_supervisor_number: request.training_supervisor_number,
    training_supervisor_email: request.training_supervisor_email,
    university_college: request.university_college,
    qualification: request.qualification,
    major: request.major,
    gpa_scale: request.gpa_scale,
    cumulative_gpa: request.cumulative_gpa,
    english_level: request.english_level,
    desired_city_for_training: request.desired_city_for_training,
    current_city_of_residency: request.current_city_of_residency,
    disability: request.disability,
    declaration_accepted: request.declaration_accepted,
  }
}

export default function CooperativeTrainingPanel({ refreshKey = 0, onCountChange, onChanged }: Props) {
  const [requests, setRequests] = useState<CooperativeTrainingRequest[]>([])
  const [form, setForm] = useState<CooperativeTrainingPayload>(emptyTrainingRequest)
  const [editing, setEditing] = useState<CooperativeTrainingRequest | null>(null)
  const [transcript, setTranscript] = useState<File | null>(null)
  const [universityRequest, setUniversityRequest] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await api.cooperativeTrainingRequests()
      setRequests(items)
      onCountChange?.(items.length)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load cooperative training requests')
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests, refreshKey])

  const clearForm = () => {
    setForm(emptyTrainingRequest)
    setTranscript(null)
    setUniversityRequest(null)
    setFileInputKey((current) => current + 1)
  }

  const openCreate = () => {
    setEditing(null)
    clearForm()
    setError(null)
    setNotice(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (request: CooperativeTrainingRequest) => {
    setEditing(request)
    setForm(toPayload(request))
    setTranscript(null)
    setUniversityRequest(null)
    setFileInputKey((current) => current + 1)
    setError(null)
    setNotice(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    clearForm()
  }

  const saveRequest = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing && (!transcript || !universityRequest)) {
      setError('Upload both the transcript and the university cooperative-training request.')
      return
    }
    if (form.cumulative_gpa > form.gpa_scale) {
      setError(`Cumulative GPA cannot be higher than ${form.gpa_scale}.`)
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      let saved: CooperativeTrainingRequest
      if (editing) {
        saved = await api.updateCooperativeTrainingRequest(editing.id, form)
        if (transcript) {
          saved = await api.replaceCooperativeTrainingDocument(editing.id, 'Transcript', transcript)
        }
        if (universityRequest) {
          saved = await api.replaceCooperativeTrainingDocument(editing.id, 'University Request', universityRequest)
        }
        setRequests((current) => current.map((item) => item.id === saved.id ? saved : item))
        setNotice(`Cooperative training request for ${saved.first_name} ${saved.last_name} was updated successfully.`)
      } else {
        saved = await api.createCooperativeTrainingRequest(form, transcript!, universityRequest!)
        setRequests((current) => [saved, ...current])
        onCountChange?.(requests.length + 1)
        setNotice(`Cooperative training request for ${saved.first_name} ${saved.last_name} was submitted successfully.`)
      }
      onChanged?.()
      closeForm()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the cooperative training request')
    } finally {
      setSaving(false)
    }
  }

  const deleteRequest = async (request: CooperativeTrainingRequest) => {
    const applicant = `${request.first_name} ${request.last_name}`
    if (!window.confirm(`Delete the cooperative training request for ${applicant}? This also deletes its documents and cannot be undone.`)) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await api.deleteCooperativeTrainingRequest(request.id)
      const remaining = requests.filter((item) => item.id !== request.id)
      setRequests(remaining)
      onCountChange?.(remaining.length)
      if (editing?.id === request.id) closeForm()
      setNotice(`Cooperative training request for ${applicant} was deleted successfully.`)
      onChanged?.()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the cooperative training request')
    } finally {
      setSaving(false)
    }
  }

  const setupModule = async () => {
    setSettingUp(true)
    setError(null)
    try {
      await api.setupSharepoint()
      await loadRequests()
      setNotice('The cooperative training module is ready.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to set up the cooperative training module')
    } finally {
      setSettingUp(false)
    }
  }

  return <>
    {error && <Alert type="error" message={error} />}
    {notice && <Alert type="success" message={notice} />}

    {showForm && <form className="panel admin-job-form cooperative-training-form" onSubmit={(event) => void saveRequest(event)}>
      <div className="panel-heading">
        <div><h2>{editing ? 'Edit cooperative training request' : 'New cooperative training request'}</h2><p>Complete the applicant, education, training, and document details.</p></div>
        <button type="button" className="icon-button" onClick={closeForm} aria-label="Close form"><X size={18} /></button>
      </div>
      <div className="admin-job-fields cooperative-training-fields">
        <label>First name<input required maxLength={100} value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} /></label>
        <label>Last name<input required maxLength={100} value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} /></label>
        <label>ID number<input required inputMode="numeric" minLength={7} maxLength={20} pattern="[1-9][0-9]{6,19}" title="Enter 7-20 digits; the first digit cannot be zero" value={form.id_number} onChange={(event) => setForm({ ...form, id_number: event.target.value })} /></label>
        <label>Mobile number<input required type="tel" minLength={7} maxLength={40} value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value })} placeholder="966 5X XXX XXXX" /></label>
        <label>Email<input required type="email" maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as CooperativeTrainingPayload['gender'] })}><option>Male</option><option>Female</option><option>Other</option></select></label>
        <label>Training duration (months)<input required type="number" min={1} max={24} value={form.training_duration} onChange={(event) => setForm({ ...form, training_duration: Number(event.target.value) })} /></label>
        <label>Semester<select value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value as CooperativeTrainingPayload['semester'] })}><option>First Semester</option><option>Second Semester</option><option>Summer Semester</option></select></label>
        <label>Training starting date<input required type="date" value={form.training_starting_date} onChange={(event) => setForm({ ...form, training_starting_date: event.target.value })} /></label>
        <label>Training supervisor name<input required maxLength={180} value={form.training_supervisor_name} onChange={(event) => setForm({ ...form, training_supervisor_name: event.target.value })} /></label>
        <label>Training supervisor number<input required type="tel" minLength={7} maxLength={40} value={form.training_supervisor_number} onChange={(event) => setForm({ ...form, training_supervisor_number: event.target.value })} /></label>
        <label>Training supervisor email<input required type="email" maxLength={255} value={form.training_supervisor_email} onChange={(event) => setForm({ ...form, training_supervisor_email: event.target.value })} /></label>
        <label>University / college<input required list="training-university-options" maxLength={200} value={form.university_college} onChange={(event) => setForm({ ...form, university_college: event.target.value })} /><datalist id="training-university-options">{universityOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
        <label>Qualification<select value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value as CooperativeTrainingPayload['qualification'] })}><option>High School</option><option>Diploma</option><option>Bachelor's Degree</option><option>Master's Degree</option><option>Doctorate</option><option>Other</option></select></label>
        <label>Major<input required list="training-major-options" maxLength={180} value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} /><datalist id="training-major-options">{majorOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
        <label>GPA scale<select value={form.gpa_scale} onChange={(event) => setForm({ ...form, gpa_scale: Number(event.target.value) as 4 | 5 })}><option value={4}>4</option><option value={5}>5</option></select></label>
        <label>Cumulative GPA<input required type="number" min={0} max={form.gpa_scale} step="0.01" value={form.cumulative_gpa} onChange={(event) => setForm({ ...form, cumulative_gpa: Number(event.target.value) })} /></label>
        <label>English level<select value={form.english_level} onChange={(event) => setForm({ ...form, english_level: event.target.value as CooperativeTrainingPayload['english_level'] })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Fluent</option></select></label>
        <label>Desired city for training<input required list="training-city-options" maxLength={100} value={form.desired_city_for_training} onChange={(event) => setForm({ ...form, desired_city_for_training: event.target.value })} /></label>
        <label>Current city of residency<input required list="training-city-options" maxLength={100} value={form.current_city_of_residency} onChange={(event) => setForm({ ...form, current_city_of_residency: event.target.value })} /><datalist id="training-city-options">{cityOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
        <label>Disability?<select value={form.disability ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, disability: event.target.value === 'yes' })}><option value="no">No</option><option value="yes">Yes</option></select></label>
        <label className="training-document-field">University / college transcript<input key={`transcript-${fileInputKey}`} required={!editing} type="file" accept=".pdf,.doc,.docx" onChange={(event) => setTranscript(event.target.files?.[0] ?? null)} /><small>{editing && form ? 'Leave empty to keep the current transcript. PDF, DOC, or DOCX; maximum 10 MB.' : 'PDF, DOC, or DOCX; maximum 10 MB.'}</small></label>
        <label className="training-document-field">University request for cooperative training<input key={`request-${fileInputKey}`} required={!editing} type="file" accept=".pdf,.doc,.docx" onChange={(event) => setUniversityRequest(event.target.files?.[0] ?? null)} /><small>{editing ? 'Leave empty to keep the current request letter. PDF, DOC, or DOCX; maximum 10 MB.' : 'PDF, DOC, or DOCX; maximum 10 MB.'}</small></label>
        <label className="checkbox-label admin-job-wide training-declaration"><input required type="checkbox" checked={form.declaration_accepted} onChange={(event) => setForm({ ...form, declaration_accepted: event.target.checked })} /><span>I confirm that all information provided is accurate. If any discrepancy is found, the company may reject or cancel the application.</span></label>
      </div>
      <div className="admin-form-actions recruitment-form-actions">
        <button type="button" className="button button-secondary" onClick={clearForm}>Reset</button>
        <button type="button" className="button button-secondary" onClick={closeForm}>Cancel</button>
        <button className="button button-primary" disabled={saving}><Save size={17} />{saving ? 'Saving...' : editing ? 'Save changes' : 'Submit request'}</button>
      </div>
    </form>}

    <section className="panel admin-table-panel">
      <div className="panel-heading"><div><h2>Cooperative training requests</h2><p>Applicant details, education information, and supporting documents.</p></div>{!showForm && !error && <button className="button button-secondary button-small" onClick={openCreate}><Plus size={16} />Add request</button>}</div>
      {error && !requests.length && !loading ? <div className="recruitment-setup-state"><p>The required lists or document library may not be ready yet.</p><button className="button button-primary button-small" disabled={settingUp} onClick={() => void setupModule()}>{settingUp ? 'Setting up...' : 'Set up module'}</button></div> : loading ? <div className="page-loader compact"><span className="loader" /></div> : requests.length ? <div className="table-wrap"><table><thead><tr><th>Applicant</th><th>Contact</th><th>Training</th><th>Education</th><th>Location</th><th>Documents</th><th>Actions</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><strong>{request.first_name} {request.last_name}</strong><small>{request.id_number} · {request.gender}</small></td><td><strong>{request.mobile_number}</strong><small>{request.email}</small></td><td><strong>{request.semester}</strong><small>{request.training_duration} months · {new Date(`${request.training_starting_date}T00:00:00`).toLocaleDateString()}</small></td><td><strong>{request.major}</strong><small>{request.university_college} · GPA {request.cumulative_gpa}/{request.gpa_scale}</small></td><td><strong>{request.desired_city_for_training}</strong><small>Lives in {request.current_city_of_residency}</small></td><td><div className="training-document-links">{request.transcript_url ? <a href={request.transcript_url} target="_blank" rel="noreferrer"><FileText size={14} />Transcript<ExternalLink size={12} /></a> : <small>No transcript</small>}{request.university_request_url ? <a href={request.university_request_url} target="_blank" rel="noreferrer"><FileText size={14} />University request<ExternalLink size={12} /></a> : <small>No university request</small>}</div></td><td><div className="admin-row-actions"><button className="text-button" disabled={saving} onClick={() => openEdit(request)}><Pencil size={14} />Edit</button><button className="text-button text-button-danger" disabled={saving} onClick={() => void deleteRequest(request)}><Trash2 size={14} />Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No cooperative training requests" description="Add the first cooperative training request and its supporting documents." />}
    </section>
  </>
}
