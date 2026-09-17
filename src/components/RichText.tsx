import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
} from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

const allowedTags = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'h2',
  'h3',
  'i',
  'li',
  'ol',
  'p',
  's',
  'strike',
  'strong',
  'u',
  'ul',
])

const safeLink = (href: string) => {
  const trimmed = href.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed

  try {
    const parsed = new URL(trimmed)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

const cleanNode = (node: Node, targetDocument: Document): Node => {
  if (node.nodeType === 3) return targetDocument.createTextNode(node.textContent ?? '')

  const fragment = targetDocument.createDocumentFragment()
  if (node.nodeType !== 1) return fragment

  const source = node as HTMLElement
  const tag = source.tagName.toLowerCase()
  const children = Array.from(source.childNodes).map((child) => cleanNode(child, targetDocument))

  if (!allowedTags.has(tag)) {
    children.forEach((child) => fragment.appendChild(child))
    return fragment
  }

  if (tag === 'a') {
    const href = safeLink(source.getAttribute('href') ?? '')
    if (!href) {
      children.forEach((child) => fragment.appendChild(child))
      return fragment
    }

    const link = targetDocument.createElement('a')
    link.setAttribute('href', href)
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    children.forEach((child) => link.appendChild(child))
    return link
  }

  const element = targetDocument.createElement(tag)
  children.forEach((child) => element.appendChild(child))
  return element
}

export const sanitizeRichText = (value: string) => {
  if (!value.trim()) return ''

  const parsed = new DOMParser().parseFromString(value, 'text/html')
  const output = parsed.createElement('div')
  Array.from(parsed.body.childNodes).forEach((node) => output.appendChild(cleanNode(node, parsed)))
  return output.innerHTML
}

const richTextTagPattern = /<\/?(?:a|b|blockquote|br|div|em|h2|h3|i|li|ol|p|s|strike|strong|u|ul)\b/i

const plainTextToHtml = (value: string, legacyList: boolean) => {
  const parsed = document.implementation.createHTMLDocument('')
  const output = parsed.createElement('div')
  const lines = value.replace(/\r/g, '').split('\n')

  if (legacyList) {
    const list = parsed.createElement('ul')
    lines.map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const item = parsed.createElement('li')
      item.textContent = line
      list.appendChild(item)
    })
    output.appendChild(list)
    return output.innerHTML
  }

  const paragraphs = value.replace(/\r/g, '').split(/\n{2,}/)
  paragraphs.forEach((paragraph) => {
    const element = parsed.createElement('p')
    paragraph.split('\n').forEach((line, index) => {
      if (index > 0) element.appendChild(parsed.createElement('br'))
      element.appendChild(parsed.createTextNode(line))
    })
    output.appendChild(element)
  })
  return output.innerHTML
}

export const normalizeRichText = (value: string, legacyList = false) => {
  if (!value.trim()) return ''
  return richTextTagPattern.test(value)
    ? sanitizeRichText(value)
    : plainTextToHtml(value, legacyList)
}

export const richTextCharacterCount = (value: string) => {
  if (!value.trim()) return 0
  if (!richTextTagPattern.test(value)) return value.trim().length

  const parsed = new DOMParser().parseFromString(sanitizeRichText(value), 'text/html')
  return (parsed.body.textContent ?? '').trim().length
}

const htmlWithinTextLimit = (value: string, textLimit: number) => {
  const parsed = new DOMParser().parseFromString(value, 'text/html')
  const output = parsed.createElement('div')
  let remaining = textLimit

  const cloneWithinLimit = (node: Node): Node | null => {
    if (node.nodeType === 3) {
      if (remaining <= 0) return null
      const text = node.textContent ?? ''
      const accepted = text.slice(0, remaining)
      remaining -= accepted.length
      return accepted ? parsed.createTextNode(accepted) : null
    }

    if (node.nodeType !== 1 || remaining <= 0) return null
    const source = node as HTMLElement
    if (source.tagName.toLowerCase() === 'br') return source.cloneNode(false)

    const clone = source.cloneNode(false) as HTMLElement
    Array.from(source.childNodes).forEach((child) => {
      const accepted = cloneWithinLimit(child)
      if (accepted) clone.appendChild(accepted)
    })
    return clone.childNodes.length ? clone : null
  }

  Array.from(parsed.body.childNodes).forEach((node) => {
    const accepted = cloneWithinLimit(node)
    if (accepted) output.appendChild(accepted)
  })
  return output.innerHTML
}

const truncateRichText = (value: string, maxLength: number) => {
  const sanitized = sanitizeRichText(value)
  if (sanitized.length <= maxLength) return sanitized

  const parsed = new DOMParser().parseFromString(sanitized, 'text/html')
  const visibleLength = (parsed.body.textContent ?? '').length
  let minimum = 0
  let maximum = visibleLength
  let accepted = ''

  while (minimum <= maximum) {
    const midpoint = Math.floor((minimum + maximum) / 2)
    const candidate = htmlWithinTextLimit(sanitized, midpoint)
    if (candidate.length <= maxLength) {
      accepted = candidate
      minimum = midpoint + 1
    } else {
      maximum = midpoint - 1
    }
  }

  return accepted
}

const placeCaretAtEnd = (element: HTMLElement) => {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(element)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

type RichTextEditorProps = {
  className?: string
  label: string
  legacyList?: boolean
  maxLength: number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value: string
}

export function RichTextEditor({
  className = '',
  label,
  legacyList = false,
  maxLength,
  onChange,
  placeholder = '',
  required = false,
  value,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastAcceptedValue = useRef('')
  const pasteInProgress = useRef(false)
  const labelId = useId()
  const [characterCount, setCharacterCount] = useState(() => normalizeRichText(value, legacyList).length)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return

    const normalized = normalizeRichText(value, legacyList)
    if (editor.innerHTML !== normalized) editor.innerHTML = normalized
    lastAcceptedValue.current = normalized
    setCharacterCount(normalized.length)
    setLimitReached(normalized.length > maxLength)
  }, [legacyList, maxLength, value])

  const emitValue = (truncateOverflow = false) => {
    const editor = editorRef.current
    if (!editor) return

    const sanitized = sanitizeRichText(editor.innerHTML)
    let nextValue = richTextCharacterCount(sanitized) === 0 ? '' : sanitized
    let nextCount = nextValue.length

    if (truncateOverflow && nextCount > maxLength) {
      nextValue = truncateRichText(nextValue, maxLength)
      nextCount = nextValue.length
      editor.innerHTML = nextValue
      placeCaretAtEnd(editor)
      lastAcceptedValue.current = nextValue
      setCharacterCount(nextCount)
      setLimitReached(true)
      onChange(nextValue)
      return
    }

    if (nextCount > maxLength && nextCount >= lastAcceptedValue.current.length) {
      editor.innerHTML = lastAcceptedValue.current
      placeCaretAtEnd(editor)
      setLimitReached(true)
      return
    }

    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue
      placeCaretAtEnd(editor)
    }
    lastAcceptedValue.current = nextValue
    setCharacterCount(nextCount)
    setLimitReached(nextCount > maxLength)
    onChange(nextValue)
  }

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    emitValue()
  }

  const addLink = () => {
    const enteredLink = window.prompt('Enter a web or email link')
    if (!enteredLink) return
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(enteredLink) ? enteredLink : `https://${enteredLink}`
    const href = safeLink(candidate)
    if (href) runCommand('createLink', href)
  }

  const pasteContent = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    pasteInProgress.current = true
    try {
      const html = event.clipboardData.getData('text/html')
      if (html) {
        document.execCommand('insertHTML', false, sanitizeRichText(html))
      } else {
        document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
      }
      emitValue(true)
    } finally {
      pasteInProgress.current = false
    }
  }

  const controls = [
    { command: 'bold', label: 'Bold', icon: <Bold size={17} /> },
    { command: 'italic', label: 'Italic', icon: <Italic size={17} /> },
    { command: 'underline', label: 'Underline', icon: <Underline size={17} /> },
    { command: 'insertUnorderedList', label: 'Bulleted list', icon: <List size={18} /> },
    { command: 'insertOrderedList', label: 'Numbered list', icon: <ListOrdered size={18} /> },
  ]

  return (
    <div className={`rich-text-field ${className}`.trim()}>
      <span className="rich-text-label" id={labelId}>{label}{required && <em> *</em>}</span>
      <div className={`rich-text-editor ${limitReached ? 'rich-text-editor-limit' : ''}`}>
        <div className="rich-text-toolbar" aria-label={`${label} formatting controls`} role="toolbar">
          {controls.map((control) => <button key={control.command} type="button" title={control.label} aria-label={control.label} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand(control.command)}>{control.icon}</button>)}
          <span className="rich-text-toolbar-separator" />
          <button type="button" title="Add link" aria-label="Add link" onMouseDown={(event) => event.preventDefault()} onClick={addLink}><Link2 size={17} /></button>
          <button type="button" title="Clear formatting" aria-label="Clear formatting" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand('removeFormat')}><RemoveFormatting size={17} /></button>
        </div>
        <div
          ref={editorRef}
          className="rich-text-surface"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-labelledby={labelId}
          aria-multiline="true"
          aria-required={required}
          data-placeholder={placeholder}
          onBlur={() => emitValue()}
          onInput={() => { if (!pasteInProgress.current) emitValue() }}
          onPaste={pasteContent}
        />
      </div>
      <small className={`field-character-count ${limitReached ? 'character-count-limit' : ''}`}>{characterCount.toLocaleString()} / {maxLength.toLocaleString()} characters, including formatting{limitReached ? ' — maximum reached' : ''}</small>
    </div>
  )
}

export function RichTextContent({ value, className = '', legacyList = false }: { value: string; className?: string; legacyList?: boolean }) {
  const html = useMemo(() => normalizeRichText(value, legacyList), [legacyList, value])
  return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />
}
