import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export const ADMIN_PAGE_SIZE = 10

export function paginateRows<T>(rows: T[], requestedPage: number, pageSize = ADMIN_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const start = (page - 1) * pageSize
  return { rows: rows.slice(start, start + pageSize), page, totalPages }
}

export function AdminTableSearch({
  value,
  onChange,
  placeholder,
  filteredCount,
  totalCount,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  filteredCount: number
  totalCount: number
}) {
  return (
    <div className="admin-table-search">
      <label>
        <Search size={17} />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      <span>{filteredCount === totalCount ? `${totalCount} records` : `${filteredCount} of ${totalCount} records`}</span>
    </div>
  )
}

export function AdminTablePagination({
  page,
  totalPages,
  filteredCount,
  onChange,
}: {
  page: number
  totalPages: number
  filteredCount: number
  onChange: (page: number) => void
}) {
  if (filteredCount === 0) return null
  return (
    <nav className="admin-pagination" aria-label="Table pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />Previous
      </button>
      <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next<ChevronRight size={16} />
      </button>
    </nav>
  )
}
