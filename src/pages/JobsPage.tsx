import { BarChart3, BriefcaseBusiness, Building2, CheckCircle2, Globe2, HeartPulse, MapPin, RotateCcw, Search, UsersRound } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import JobCard from '../components/JobCard'
import { EmptyState } from '../components/Feedback'
import { api, type JobList, type LookupOptions } from '../services/api'

const emptyData: JobList = { items: [], total: 0, filters: { countries: [], cities: [], divisions: [], job_functions: [], career_levels: [] } }
const emptyLookups: LookupOptions = { countries: [], divisions: [], job_functions: [], career_levels: [] }
const initialFilters = { keywords: '', country: '', city: '', division: '', job_function: '', career_level: '', sort: 'recent' }

export default function JobsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState<JobList>(emptyData)
  const [lookups, setLookups] = useState<LookupOptions>(emptyLookups)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (values = filters) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    Object.entries(values).forEach(([key, value]) => value && params.set(key, value))
    try {
      setData(await api.jobs(params))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(initialFilters)
    api.applications()
      .then((applications) => setAppliedJobIds(new Set(applications.map((application) => application.job.id))))
      .catch(() => setAppliedJobIds(new Set()))
    api.lookups().then(setLookups).catch(() => undefined)
  }, [])

  const submit = (event: FormEvent) => { event.preventDefault(); void load() }
  const clear = () => { setFilters(initialFilters); void load(initialFilters) }
  const update = (field: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [field]: value }))
  const updateCountry = (country: string) => setFilters((current) => {
    const cities = lookups.countries.find((item) => item.name === country)?.cities ?? []
    return { ...current, country, city: !country || cities.includes(current.city) ? current.city : '' }
  })
  const countryOptions = lookups.countries.length ? lookups.countries.map((country) => country.name) : data.filters.countries
  const cityOptions = lookups.countries.length
    ? filters.country
      ? lookups.countries.find((country) => country.name === filters.country)?.cities ?? []
      : Array.from(new Set(lookups.countries.flatMap((country) => country.cities)))
    : data.filters.cities
  const divisionOptions = lookups.divisions.length ? lookups.divisions : data.filters.divisions
  const jobFunctionOptions = lookups.job_functions.length ? lookups.job_functions : data.filters.job_functions
  const careerLevelOptions = lookups.career_levels.length ? lookups.career_levels : data.filters.career_levels

  return (
    <div className="page-container jobs-page">
      <div className="jobs-layout">
        <section className="jobs-main">
          <form className="panel search-panel" onSubmit={submit}>
            <div className="search-heading"><span className="eyebrow"><Search size={16} />Opportunity finder</span><h1>Search for a job</h1><p>Use the filters to discover a role that fits your next move.</p></div>
            <div className="search-fields">
              <label><span><Search size={18} />Keywords</span><input value={filters.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="e.g. Developer, Analyst, Engineer" /></label>
              <label><span><Globe2 size={18} />Country</span><select value={filters.country} onChange={(event) => updateCountry(event.target.value)}><option value="">All countries</option>{countryOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span><MapPin size={18} />City</span><select value={filters.city} onChange={(event) => update('city', event.target.value)}><option value="">All cities</option>{cityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span><Building2 size={18} />Division</span><select value={filters.division} onChange={(event) => update('division', event.target.value)}><option value="">All divisions</option>{divisionOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span><BriefcaseBusiness size={18} />Job function</span><select value={filters.job_function} onChange={(event) => update('job_function', event.target.value)}><option value="">All job functions</option>{jobFunctionOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span><BarChart3 size={18} />Career level</span><select value={filters.career_level} onChange={(event) => update('career_level', event.target.value)}><option value="">All career levels</option>{careerLevelOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="search-actions"><button className="button button-primary" type="submit"><Search size={17} />Search</button><button className="button button-secondary" type="button" onClick={clear}><RotateCcw size={17} />Clear</button></div>
          </form>
          <div className="results-heading"><div><h2>Search results <span>{data.total}</span></h2><p>{filters.keywords ? `Matching “${filters.keywords}”` : 'Fresh opportunities for you'}</p></div><label>Sort by:<select value={filters.sort} onChange={(event) => { const next = { ...filters, sort: event.target.value }; setFilters(next); void load(next) }}><option value="recent">Most recent</option><option value="oldest">Oldest</option><option value="title">Job title</option></select></label></div>
          {error && <div className="alert alert-error">{error}</div>}
          {loading ? <div className="loading-stack">{[1, 2, 3].map((item) => <div className="skeleton job-card" key={item} />)}</div> : data.items.length ? <div className="job-list">{data.items.map((job) => <JobCard key={job.id} job={job} applied={appliedJobIds.has(job.id)} />)}</div> : <EmptyState title="No matching roles" description="Try broadening your filters or clearing the search." />}
        </section>
        <aside className="jobs-aside">
          <article className="career-hero"><div><span>Careers with purpose</span><h2>Build your future with us.</h2><p>Join a team that values curiosity, collaboration and personal growth.</p></div></article>
          <article className="panel benefits-panel"><h2>Why you’ll love working here</h2><div className="benefit-row"><span className="tone-blue"><HeartPulse /></span><div><strong>Health & wellness</strong><p>Comprehensive support for you and your family.</p></div></div><div className="benefit-row"><span className="tone-green"><BarChart3 /></span><div><strong>Career growth</strong><p>Clear paths, mentorship and continuous learning.</p></div></div><div className="benefit-row"><span className="tone-violet"><UsersRound /></span><div><strong>Great culture</strong><p>A diverse, inclusive workplace where everyone belongs.</p></div></div></article>
          <article className="panel guidelines-panel"><h2>General guidelines</h2><p><CheckCircle2 />We are an equal opportunity employer.</p><p><CheckCircle2 />We value diversity and encourage everyone to apply.</p><p><CheckCircle2 />Your information is secure and confidential.</p><a href="#privacy">View our privacy statement</a></article>
        </aside>
      </div>
    </div>
  )
}
