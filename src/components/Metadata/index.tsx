import { useState, useRef, useEffect } from "react"
import { useMainStore } from "@/store"

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

interface EditableFieldProps {
  value: string
  placeholder: string
  icon: React.ReactNode
  onSave: (value: string) => void
}

function EditableField({ value, placeholder, icon, onSave }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSubmit = () => {
    onSave(editValue)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        {icon}
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
            if (e.key === "Escape") {
              setEditValue(value)
              setEditing(false)
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-7 bg-zinc-700 text-white border border-zinc-600 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 w-full text-left group hover:bg-zinc-800 px-1 py-0.5 -mx-1 transition-colors"
    >
      {icon}
      <span className={`text-sm truncate ${value ? "text-zinc-200" : "text-zinc-500 italic"}`}>
        {value || placeholder}
      </span>
    </button>
  )
}

export default function Metadata() {
  const metadata = useMainStore((s) => s.metadata)
  const setMetadataAuthor = useMainStore((s) => s.setMetadataAuthor)
  const setMetadataSocial = useMainStore((s) => s.setMetadataSocial)
  const setMetadataCommentary = useMainStore((s) => s.setMetadataCommentary)

  const [commentaryEditing, setCommentaryEditing] = useState(false)
  const [commentaryValue, setCommentaryValue] = useState(metadata.commentary)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCommentaryValue(metadata.commentary)
  }, [metadata.commentary])

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.max(96, textareaRef.current.scrollHeight)}px`
    }
  }

  useEffect(() => {
    if (commentaryEditing && textareaRef.current) {
      textareaRef.current.focus()
      adjustTextareaHeight()
    }
  }, [commentaryEditing])

  const handleCommentarySubmit = () => {
    setMetadataCommentary(commentaryValue)
    setCommentaryEditing(false)
  }

  return (
    <aside
      className="w-[280px] max-w-[90vw] flex flex-col border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden"
      aria-label="Build metadata"
    >
      <div className="flex items-center justify-between p-3 border-b border-zinc-700 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-200">Metadata</h2>
      </div>

      <div className="p-3 space-y-3">
        <EditableField
          value={metadata.author}
          placeholder="Author name"
          icon={<PersonIcon />}
          onSave={setMetadataAuthor}
        />

        <EditableField
          value={metadata.social}
          placeholder="Social link"
          icon={<LinkIcon />}
          onSave={setMetadataSocial}
        />

        <div className="pt-1">
          {commentaryEditing ? (
            <textarea
              ref={textareaRef}
              value={commentaryValue}
              onChange={(e) => {
                setCommentaryValue(e.target.value)
                adjustTextareaHeight()
              }}
              onBlur={handleCommentarySubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault()
                  handleCommentarySubmit()
                } else if (e.key === "Escape") {
                  setCommentaryValue(metadata.commentary)
                  setCommentaryEditing(false)
                }
              }}
              placeholder="Write commentary here"
              className="w-full min-h-24 bg-zinc-700 text-white text-sm border border-zinc-600 px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => setCommentaryEditing(true)}
              className="w-full text-left hover:bg-zinc-800 px-1 py-1 -mx-1 transition-colors min-h-12"
            >
              <span className={`text-sm whitespace-pre-wrap wrap-break-word ${metadata.commentary ? "text-zinc-200" : "text-zinc-500 italic"}`}>
                {metadata.commentary || "Write commentary here"}
              </span>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
