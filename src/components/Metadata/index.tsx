import { useState, useRef, useEffect, useCallback } from "react"
import { useMainStore } from "@/store"
import { useUIStore } from "@/store/ui"
import { getHudImagePath } from "@/utils/assetPaths"
import { playSound } from "@/utils/sound"
import { clearPersistedDataAndReload, runDebug } from "@/utils/debugTools"
import PanelCorners from "@/components/PanelCorners"

const VOLUME_PREVIEW_SOUND = "UI_Mainmenu_Button_open.mp3"

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

const MediaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <polygon points="9 8 15 12 9 16 9 8" />
  </svg>
)

function DebugButton() {
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const handleDebug = useCallback(async () => {
    try {
      await runDebug()
    } catch {
      // Ignore clipboard errors
    }
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    setCopied(true)
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false)
      copyTimeoutRef.current = null
    }, 800)
  }, [])

  return (
    <button
      type="button"
      onClick={handleDebug}
      className="text-xs text-zinc-500 hover:text-zinc-400 cursor-pointer bg-transparent border-none p-0 font-inherit"
      aria-label="Copy debug report to clipboard and log to console"
    >
      {copied ? "Copied" : "Debug"}
    </button>
  )
}

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
          className="flex-1 min-w-0 h-7 bg-zinc-700 text-white border border-zinc-600 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 w-full text-left group hover:bg-zinc-800 px-1 py-0.5 -mx-1 transition-colors cursor-pointer"
    >
      {icon}
      <span className={`text-sm truncate ${value ? "text-zinc-200" : "text-zinc-500 italic"}`}>
        {value || placeholder}
      </span>
    </button>
  )
}

/* SVG speaker icons (24×24), colored via currentColor */
const VolumeMuteSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="volume-icon w-6 h-6 shrink-0" aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
)
const VolumeLowSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="volume-icon w-6 h-6 shrink-0" aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)
const VolumeMediumSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="volume-icon w-6 h-6 shrink-0" aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
)
const VolumeHighSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="volume-icon w-6 h-6 shrink-0" aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M22.61 2.39a15 15 0 0 1 0 19.22" />
  </svg>
)

function VolumeIcon({ volume, muted }: { volume: number; muted: boolean }) {
  if (muted) return <VolumeMuteSvg />
  if (volume <= 33) return <VolumeLowSvg />
  if (volume <= 66) return <VolumeMediumSvg />
  return <VolumeHighSvg />
}

function VolumeControl() {
  const volume = useUIStore((s) => s.volume)
  const muted = useUIStore((s) => s.muted)
  const setVolume = useUIStore((s) => s.setVolume)
  const toggleMuted = useUIStore((s) => s.toggleMuted)

  return (
    <div className="p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMuted}
          className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Toggle sound"
        >
          <VolumeIcon volume={volume} muted={muted} />
        </button>
        <button
          type="button"
          onClick={() => {
            setVolume(volume - 10)
            playSound(VOLUME_PREVIEW_SOUND)
          }}
          className="p-0.5 shrink-0 cursor-pointer hover:opacity-80"
          aria-label="Decrease volume"
        >
          <img src={getHudImagePath("settings/minus.png")} alt="" width={20} height={20} />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value)
            setVolume(v)
            playSound(VOLUME_PREVIEW_SOUND)
          }}
          className="volume-slider flex-1 min-w-0"
          style={{ "--range-percent": `${volume}%` } as React.CSSProperties}
          aria-label="Volume"
        />
        <button
          type="button"
          onClick={() => {
            setVolume(volume + 10)
            playSound(VOLUME_PREVIEW_SOUND)
          }}
          className="p-0.5 shrink-0 cursor-pointer hover:opacity-80"
          aria-label="Increase volume"
        >
          <img src={getHudImagePath("settings/plus.png")} alt="" width={20} height={20} />
        </button>
      </div>
    </div>
  )
}

export default function Metadata() {
  const metadata = useMainStore((s) => s.metadata)
  const setMetadataAuthor = useMainStore((s) => s.setMetadataAuthor)
  const setMetadataSocial = useMainStore((s) => s.setMetadataSocial)
  const setMetadataMedia = useMainStore((s) => s.setMetadataMedia)
  const setMetadataCommentary = useMainStore((s) => s.setMetadataCommentary)
  const lightweightMode = useUIStore((s) => s.lightweightMode)
  const setLightweightMode = useUIStore((s) => s.setLightweightMode)

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
    <div className="shrink-0 w-[280px] flex flex-col min-h-0 max-h-[calc(100vh-2.5rem-4em-1rem)] overflow-y-auto">
      <aside
        className="relative w-full flex flex-col border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden"
        aria-label="Build metadata"
      >
        <PanelCorners />
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

          <EditableField
            value={metadata.media}
            placeholder="Media link"
            icon={<MediaIcon />}
            onSave={setMetadataMedia}
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
                className="w-full min-h-24 bg-zinc-700 text-white text-sm border border-zinc-600 px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              />
            ) : (
              <button
                type="button"
                onClick={() => setCommentaryEditing(true)}
                className="w-full text-left hover:bg-zinc-800 px-1 py-1 -mx-1 transition-colors min-h-12 cursor-pointer"
              >
                <span className={`text-sm whitespace-pre-wrap wrap-break-word ${metadata.commentary ? "text-zinc-200" : "text-zinc-500 italic"}`}>
                  {metadata.commentary || "Write commentary here"}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-b border-zinc-700 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-200">Settings</h2>
        </div>

        <div className="p-3">
        </div>

        <VolumeControl />
        <div className="p-3">
          <button
            type="button"
            onClick={() => setLightweightMode(!lightweightMode)}
            role="checkbox"
            aria-checked={lightweightMode}
            aria-label="Lightweight mode"
            className={`flex items-center gap-2 w-full text-left px-2 py-1.5 -mx-1 rounded text-sm transition-colors cursor-pointer hover:bg-zinc-800 ${lightweightMode ? "bg-zinc-800 text-zinc-200" : "text-zinc-400"}`}
          >
            <img
              src={lightweightMode ? getHudImagePath("settings/checkbox_true.png") : getHudImagePath("settings/checkbox_false.png")}
              alt=""
              width={18}
              height={18}
              className="shrink-0"
            />
            Disable animations
          </button>
        </div>
      </aside>
      <div className="flex justify-center items-center pt-2 gap-1">
        <button
          type="button"
          onClick={clearPersistedDataAndReload}
          className="text-xs text-zinc-500 hover:text-zinc-400 cursor-pointer bg-transparent border-none p-0 font-inherit"
          aria-label="Clear all saved data and reload"
        >
          Clear data
        </button>
        <span className="text-xs text-zinc-500">|</span>
        <DebugButton />
      </div>
    </div>
  )
}
