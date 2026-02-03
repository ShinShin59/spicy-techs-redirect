import { useState, useRef, useEffect } from "react"
import { useMainStore, getSharePayloadFromState } from "@/store"
import { useShallow } from "zustand/react/shallow"
import { encodeBuildPayload, getShareUrl } from "@/utils/mainBaseShare"

export function useShareButton() {
  const sharePayload = useMainStore(useShallow(getSharePayloadFromState))
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const handleShare = () => {
    const encoded = encodeBuildPayload(sharePayload)
    const url = getShareUrl(encoded)
    void navigator.clipboard.writeText(url).catch(() => { })
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    setCopied(true)
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false)
      copyTimeoutRef.current = null
    }, 800)
  }

  return { copied, handleShare }
}
