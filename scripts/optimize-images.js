#!/usr/bin/env node
/**
 * Convert all PNG images under public/images/ to WebP.
 *
 * - Files ≤ 16 KB  → lossless WebP (small icons / UI pieces)
 * - Files >  16 KB  → lossy WebP, quality 85
 *
 * The original .png files are deleted after successful conversion.
 * Run:  node scripts/optimize-images.js
 */

import sharp from "sharp"
import { readdir, stat, unlink } from "node:fs/promises"
import path from "node:path"

const PUBLIC_IMAGES = path.resolve(import.meta.dirname, "../public/images")
const LOSSLESS_THRESHOLD = 16 * 1024 // 16 KB

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (entry.isFile() && /\.png$/i.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

async function convert(file) {
  const info = await stat(file)
  const lossless = info.size <= LOSSLESS_THRESHOLD
  const outPath = file.replace(/\.png$/i, ".webp")

  await sharp(file)
    .webp(lossless ? { lossless: true } : { quality: 85 })
    .toFile(outPath)

  const outInfo = await stat(outPath)
  const saved = ((1 - outInfo.size / info.size) * 100).toFixed(1)
  await unlink(file)
  return { file: path.relative(PUBLIC_IMAGES, file), original: info.size, converted: outInfo.size, saved }
}

async function main() {
  const files = await walk(PUBLIC_IMAGES)
  console.log(`Found ${files.length} PNG files in public/images/\n`)

  let totalOriginal = 0
  let totalConverted = 0

  for (const file of files) {
    try {
      const result = await convert(file)
      totalOriginal += result.original
      totalConverted += result.converted
      console.log(`  ✓ ${result.file}  ${fmt(result.original)} → ${fmt(result.converted)}  (−${result.saved}%)`)
    } catch (err) {
      console.error(`  ✗ ${path.relative(PUBLIC_IMAGES, file)}: ${err.message}`)
    }
  }

  console.log(`\nTotal: ${fmt(totalOriginal)} → ${fmt(totalConverted)}  (−${((1 - totalConverted / totalOriginal) * 100).toFixed(1)}%)`)
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
