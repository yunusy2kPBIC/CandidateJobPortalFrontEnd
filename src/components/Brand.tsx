import { BriefcaseBusiness } from 'lucide-react'
import { Link } from 'react-router'

export default function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link to="/dashboard" className={`brand ${light ? 'brand-light' : ''}`} aria-label="PBICareerPosting home">
      <span className="brand-mark"><BriefcaseBusiness size={compact ? 20 : 25} strokeWidth={2.2} /></span>
      <span className="brand-copy">
        <strong>PBICareerPosting</strong>
        {!compact && <small>Build your future with us</small>}
      </span>
    </Link>
  )
}
