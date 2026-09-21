import type { ReactNode } from 'react'
import { Link } from 'react-router'
import Brand from './Brand'

export default function PublicLayout({ children, action }: { children: ReactNode; action: 'signin' | 'register' }) {
  return (
    <div className="public-page">
      <header className="public-header">
        <Brand light />
        <div className="public-header-action">
          <span>{action === 'signin' ? 'Already have an account?' : 'New to PBIC Career JobPosting?'}</span>
          <Link className="button button-ghost-light button-small" to={action === 'signin' ? '/login' : '/register'}>
            {action === 'signin' ? 'Sign In' : 'Create account'}
          </Link>
        </div>
      </header>
      <main className="public-main">{children}</main>
      <footer className="public-footer">
        <span>© 2026 PBIC Career Job Posting. All rights reserved.</span>
        <nav aria-label="Legal links">
          <Link to="/privacy">Privacy Policy</Link>
          <span>•</span>
          <a href="#terms">Terms of Use</a>
          <span>•</span>
          <a href="mailto:careers@example.com">Contact Us</a>
        </nav>
      </footer>
    </div>
  )
}
