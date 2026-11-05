import { CheckCircle2, ClipboardCheck, MailCheck, Save, ShieldCheck } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import PublicLayout from '../components/PublicLayout'
import { Alert } from '../components/Feedback'
import {
  api,
  type PublicRecruitmentRequestPayload,
  type PublicRecruitmentRequestResult,
} from '../services/api'

const preferredPositionSuggestions = [
  'Applications Project Manager',
  'Business Analyst',
  'System Administrator',
  'Software Developer',
  'IT Support Engineer',
]

const employerOptions = [
  'ABC Technologies',
  'Global Solutions',
  'Tech Services Co.',
  'Digital Innovations',
  'Smart Systems',
  'Other',
  'Not currently employed',
]

const cityOptions = ['Riyadh', 'Jeddah', 'Dammam', 'Al Khobar', 'Other']

const createInitialForm = (): PublicRecruitmentRequestPayload => ({
  preferred_position: '',
  name: '',
  nationality: '',
  gender: 'Male',
  driver_license_type: 'None',
  mobile_number: '',
  email_address: '',
  iqama_number: '',
  iqama_profession: '',
  current_employer: 'Not currently employed',
  date_of_birth: '',
  city: '',
  accept_work_in_another_city: false,
  qualification: "Bachelor's Degree",
  current_salary: 0,
  comments: '',
})

function latestAdultBirthDate() {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().slice(0, 10)
}

export default function RecruitmentRequestPage() {
  const [form, setForm] = useState<PublicRecruitmentRequestPayload>(createInitialForm)
  const [nationalities, setNationalities] = useState<string[]>([])
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicRecruitmentRequestResult | null>(null)

  useEffect(() => {
    let active = true
    api.lookups()
      .then((lookups) => {
        if (active) setNationalities(lookups.nationalities)
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load the application form')
      })
    return () => { active = false }
  }, [])

  const iqamaProfessionRequired = form.iqama_number.length > 0 && !form.iqama_number.startsWith('1')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!accuracyConfirmed) {
      setError('Confirm that the information you entered is complete and accurate.')
      return
    }
    setSubmitting(true)
    try {
      const submitted = await api.submitPublicRecruitmentRequest(form)
      setResult(submitted)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit your recruitment request')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const startAnother = () => {
    setForm(createInitialForm())
    setAccuracyConfirmed(false)
    setError(null)
    setResult(null)
  }

  return (
    <PublicLayout action="signin">
      <div className="public-recruitment-layout">
        {result ? (
          <section className="public-recruitment-complete">
            <span className="public-recruitment-success-icon"><CheckCircle2 /></span>
            <span className="eyebrow">Request submitted</span>
            <h1>Thank you, your information has been received</h1>
            <p>PBIC Recruitment can now review your request in the Administration portal.</p>
            <div className="public-recruitment-reference">
              <small>Reference number</small>
              <strong>{result.reference}</strong>
            </div>
            {result.confirmation_email_sent
              ? <div className="public-recruitment-email-status success"><MailCheck />A confirmation email was sent to the email address you provided.</div>
              : <div className="public-recruitment-email-status warning"><MailCheck />Your request was saved, but the confirmation email could not be delivered. Please keep the reference number above.</div>}
            <button type="button" className="button button-secondary" onClick={startAnother}>Submit another request</button>
          </section>
        ) : (
          <>
            <section className="public-recruitment-intro">
              <span className="eyebrow eyebrow-light"><ClipboardCheck />Recruitment request</span>
              <h1>Tell us about the opportunity you are looking for</h1>
              <p>Complete the form and our recruitment team will review your information. No portal account is required.</p>
              <div className="public-recruitment-benefits">
                <span><ShieldCheck />Your information is sent securely to the PBIC recruitment team.</span>
                <span><MailCheck />You will receive a confirmation at the email address entered below.</span>
                <span><ClipboardCheck />Keep the reference number shown after submission.</span>
              </div>
            </section>

            <form className="public-recruitment-card" onSubmit={submit}>
              <div className="public-recruitment-heading">
                <div><span className="eyebrow">Application details</span><h2>Recruitment Request</h2></div>
                <p>Fields marked with <em>*</em> are required.</p>
              </div>
              {error && <Alert type="error" message={error} />}
              <div className="admin-job-fields recruitment-request-fields public-recruitment-fields">
                <label>Preferred position <em>*</em><input required list="public-position-options" maxLength={180} value={form.preferred_position} onChange={(event) => setForm({ ...form, preferred_position: event.target.value })} /><datalist id="public-position-options">{preferredPositionSuggestions.map((value) => <option key={value} value={value} />)}</datalist></label>
                <label>Full name <em>*</em><input required maxLength={255} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                <label>Nationality <em>*</em><select required value={form.nationality} disabled={!nationalities.length} onChange={(event) => setForm({ ...form, nationality: event.target.value })}><option value="" disabled>{nationalities.length ? 'Select nationality' : 'Loading nationalities...'}</option>{nationalities.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Gender <em>*</em><select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as PublicRecruitmentRequestPayload['gender'] })}><option>Male</option><option>Female</option><option>Other</option></select></label>
                <label>Driver license type <em>*</em><select value={form.driver_license_type} onChange={(event) => setForm({ ...form, driver_license_type: event.target.value as PublicRecruitmentRequestPayload['driver_license_type'] })}><option>Saudi License</option><option>Valid GCC License</option><option>Other License</option><option>None</option></select></label>
                <label>Mobile number <em>*</em><input required type="tel" inputMode="numeric" autoComplete="tel" minLength={9} maxLength={14} pattern="(?:966|00966|0)?5[0-9]{8}" title="Enter a Saudi mobile number such as 05XXXXXXXX or 9665XXXXXXXX" value={form.mobile_number} onChange={(event) => setForm({ ...form, mobile_number: event.target.value.replace(/\D/g, '').slice(0, 14) })} placeholder="9665XXXXXXXX" /></label>
                <label>Email address <em>*</em><input required type="email" maxLength={255} autoComplete="email" value={form.email_address} onChange={(event) => setForm({ ...form, email_address: event.target.value })} /></label>
                <label>ID / Iqama number <em>*</em><input required inputMode="numeric" minLength={10} maxLength={10} pattern="[12][0-9]{9}" title="Enter a 10-digit ID or Iqama number beginning with 1 or 2" value={form.iqama_number} onChange={(event) => setForm({ ...form, iqama_number: event.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
                <label>{`Iqama profession${iqamaProfessionRequired ? ' *' : ' (optional)'}`}<input required={iqamaProfessionRequired} maxLength={150} value={form.iqama_profession} onChange={(event) => setForm({ ...form, iqama_profession: event.target.value })} /></label>
                <label>Current employer<input list="public-employer-options" maxLength={180} value={form.current_employer} onChange={(event) => setForm({ ...form, current_employer: event.target.value })} /><datalist id="public-employer-options">{employerOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
                <label>Date of birth (18+ years) <em>*</em><input required type="date" max={latestAdultBirthDate()} autoComplete="bday" title="Applicant must be at least 18 years old" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} /></label>
                <label>City (current location) <em>*</em><input required list="public-city-options" maxLength={100} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /><datalist id="public-city-options">{cityOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
                <label>Accept work in another city? <em>*</em><select value={form.accept_work_in_another_city ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, accept_work_in_another_city: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label>Qualification <em>*</em><select value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value as PublicRecruitmentRequestPayload['qualification'] })}><option>High School</option><option>Diploma</option><option>Bachelor's Degree</option><option>Master's Degree</option><option>Doctorate</option><option>Other</option></select></label>
                <label>Current salary (SAR) <em>*</em><input required type="number" min={0} max={100000000} step="1" value={form.current_salary} onChange={(event) => setForm({ ...form, current_salary: Number.isFinite(event.target.valueAsNumber) ? Math.round(event.target.valueAsNumber) : 0 })} /></label>
                <label className="admin-job-wide recruitment-comments">Comments <em>*</em><textarea required rows={4} maxLength={5000} value={form.comments} onChange={(event) => setForm({ ...form, comments: event.target.value })} placeholder="Tell us about your experience and the position you are seeking." /></label>
                <label className="checkbox-label admin-job-wide public-recruitment-declaration"><input required type="checkbox" checked={accuracyConfirmed} onChange={(event) => setAccuracyConfirmed(event.target.checked)} /><span>I confirm that the information provided is complete and accurate.</span></label>
              </div>
              <div className="admin-form-actions public-recruitment-actions">
                <button type="button" className="button button-secondary" disabled={submitting} onClick={() => { setForm(createInitialForm()); setAccuracyConfirmed(false); setError(null) }}>Reset</button>
                <button className="button button-primary" disabled={submitting || !nationalities.length}><Save size={17} />{submitting ? 'Submitting...' : 'Submit request'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </PublicLayout>
  )
}
