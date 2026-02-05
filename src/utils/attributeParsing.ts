/**
 * Shared tooltip text parsing.
 *
 * Parses resolved attribute description strings into styled segments
 * for tooltip display. After build-time resolution (via cdb-resolver.js),
 * descriptions only contain:
 *   - [BracketedName]  -> amber text (resources, buildings, etc.)
 *   - numbers with optional sign/percent (e.g. +10, -50%, 20%)  -> green text
 *   - multiplier patterns (e.g. x3, x50)  -> green text
 *   - plain text  -> default color
 */

export type SegmentType = "bracket" | "value" | "normal"
export type Segment = { type: SegmentType; text: string }

/**
 * Parse an attribute line into styled segments.
 *
 * Rules:
 *  - [Text]s? -> "bracket" segment (amber), includes trailing plural 's'
 *  - +/-digits with optional % suffix -> "value" segment (green)
 *  - standalone digits with optional % -> "value" segment (green)
 *  - x followed by digit(s) -> "value" segment (green) for multiplier
 *  - everything else -> "normal" segment
 */
export function parseAttributeLine(line: string): Segment[] {
  const segments: Segment[] = []
  let i = 0

  while (i < line.length) {
    // 1. Match [BracketedContent] with optional trailing 's' for plurals
    if (line[i] === "[") {
      const end = line.indexOf("]", i)
      if (end === -1) {
        // No closing bracket, treat as normal text
        segments.push({ type: "normal", text: line[i] })
        i++
      } else {
        // Include trailing 's' for plurals like [Village]s
        const hasPlural = end + 1 < line.length && line[end + 1] === "s"
        const text = line.slice(i + 1, end) + (hasPlural ? "s" : "")
        segments.push({ type: "bracket", text })
        i = end + 1 + (hasPlural ? 1 : 0)
      }
      continue
    }

    // 2. Match signed numbers: +10, -50, +20%, -15%
    if ((line[i] === "+" || line[i] === "-") && i + 1 < line.length && /\d/.test(line[i + 1])) {
      let j = i + 1
      // Consume digits and dots (for decimals like 0.50)
      while (j < line.length && /[\d.]/.test(line[j])) j++
      // Consume optional trailing %
      if (j < line.length && line[j] === "%") j++
      segments.push({ type: "value", text: line.slice(i, j) })
      i = j
      continue
    }

    // 3. Match unsigned numbers: 10, 50%, 0.5
    if (/\d/.test(line[i])) {
      let j = i
      while (j < line.length && /[\d.]/.test(line[j])) j++
      // Consume optional trailing %
      if (j < line.length && line[j] === "%") j++
      segments.push({ type: "value", text: line.slice(i, j) })
      i = j
      continue
    }

    // 4. Match multiplier: 'x' followed by digit(s) (e.g. x3, x50)
    if (line[i] === "x" && i + 1 < line.length && /\d/.test(line[i + 1])) {
      let j = i + 1
      while (j < line.length && /\d/.test(line[j])) j++
      segments.push({ type: "value", text: line.slice(i, j) })
      i = j
      continue
    }

    // 5. Normal text: consume until we hit a special pattern
    {
      let j = i
      while (j < line.length) {
        // Stop at bracket start
        if (line[j] === "[") break
        // Stop at sign+digit
        if ((line[j] === "+" || line[j] === "-") && j + 1 < line.length && /\d/.test(line[j + 1])) break
        // Stop at digit
        if (/\d/.test(line[j])) break
        // Stop at multiplier x+digit
        if (line[j] === "x" && j + 1 < line.length && /\d/.test(line[j + 1])) break
        j++
      }
      if (j > i) {
        segments.push({ type: "normal", text: line.slice(i, j) })
        i = j
      } else {
        // Safety: advance at least one character to prevent infinite loop
        segments.push({ type: "normal", text: line[i] })
        i++
      }
    }
  }

  return segments
}
