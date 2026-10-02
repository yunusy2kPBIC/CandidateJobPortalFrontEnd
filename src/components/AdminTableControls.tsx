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
  displayedCount,
  filteredCount,
  totalCount,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  displayedCount: number
  filteredCount: number
  totalCount: number
}) {
  const recordTotal = value.trim() ? filteredCount : totalCount
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
      <span>{displayedCount} of {recordTotal} Records</span>
    </div>
  )
}

export function AdminTablePagination({
  page,
  totalPages,
  filteredCount,
  displayedCount,
  onChange,
}: {
  page: number
  totalPages: number
  filteredCount: number
  displayedCount?: number
  onChange: (page: number) => void
}) {
  if (filteredCount === 0) return null
  const visibleRecords = displayedCount ?? Math.min(ADMIN_PAGE_SIZE, Math.max(0, filteredCount - ((page - 1) * ADMIN_PAGE_SIZE)))
  return (
    <nav className="admin-pagination" aria-label="Table pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />Previous
      </button>
      <span><strong>{visibleRecords}</strong> of <strong>{filteredCount}</strong> Records · Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next<ChevronRight size={16} />
      </button>
    </nav>
  )
}
