import React, { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

interface StickyContentRendererProps {
  content: string
  className?: string
  imageClassName?: string
}

export const StickyContentRenderer: React.FC<StickyContentRendererProps> = ({
  content,
  className = '',
  imageClassName = '',
}) => {
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)

  if (!content) return null

  // Helper to parse bold **text**
  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  // Parse lines into structured elements
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  let currentBullets: string[] = []
  let currentNumbers: { num: string; text: string }[] = []

  const flushBullets = (keyPrefix: string) => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-ul`} className="space-y-1 my-1.5 list-none pl-0">
          {currentBullets.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 mt-1.5 opacity-70" />
              <span className="flex-1">{renderFormattedInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      currentBullets = []
    }
  }

  const flushNumbers = (keyPrefix: string) => {
    if (currentNumbers.length > 0) {
      elements.push(
        <ol key={`${keyPrefix}-ol`} className="space-y-1 my-1.5 list-none pl-0">
          {currentNumbers.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
              <span className="font-bold text-[10px] min-w-4 text-right opacity-80 shrink-0 select-none">
                {item.num}.
              </span>
              <span className="flex-1">{renderFormattedInline(item.text)}</span>
            </li>
          ))}
        </ol>
      )
      currentNumbers = []
    }
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()

    // 1. Image detection: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      flushBullets(`b-${lineIdx}`)
      flushNumbers(`n-${lineIdx}`)
      const alt = imgMatch[1] || 'Gambar Catatan'
      const src = imgMatch[2]
      elements.push(
        <div key={`img-${lineIdx}`} className="my-2 group/img relative inline-block max-w-full">
          <img
            src={src}
            alt={alt}
            className={`rounded-lg max-h-48 w-auto max-w-full object-contain border border-black/10 dark:border-white/10 shadow-sm cursor-zoom-in transition group-hover/img:brightness-95 bg-white/40 dark:bg-black/20 ${imageClassName}`}
            onClick={(e) => {
              e.stopPropagation()
              setPreviewImage({ src, alt })
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewImage({ src, alt })
            }}
            className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition shadow hover:bg-black/80"
            title="Perbesar Gambar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      )
      return
    }

    // 2. Checkbox task: [ ] or [x]
    const checkMatch = trimmed.match(/^[-*•]?\s*\[([ xX])\]\s*(.*)$/)
    if (checkMatch) {
      flushBullets(`b-${lineIdx}`)
      flushNumbers(`n-${lineIdx}`)
      const isChecked = checkMatch[1].toLowerCase() === 'x'
      const itemText = checkMatch[2]
      elements.push(
        <div key={`chk-${lineIdx}`} className="flex items-start gap-2 my-1 leading-relaxed">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="w-3.5 h-3.5 mt-0.5 rounded text-blue-600 border-zinc-400 focus:ring-0 shrink-0 pointer-events-none"
          />
          <span className={`flex-1 ${isChecked ? 'line-through opacity-60' : ''}`}>
            {renderFormattedInline(itemText)}
          </span>
        </div>
      )
      return
    }

    // 3. Bullet points: starts with - , * , • 
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (bulletMatch) {
      flushNumbers(`n-${lineIdx}`)
      currentBullets.push(bulletMatch[1])
      return
    }

    // 4. Numbered list: starts with 1. , 2) , etc.
    const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/)
    if (numberMatch) {
      flushBullets(`b-${lineIdx}`)
      currentNumbers.push({ num: numberMatch[1], text: numberMatch[2] })
      return
    }

    // 5. Standard line / paragraph
    flushBullets(`b-${lineIdx}`)
    flushNumbers(`n-${lineIdx}`)

    if (!trimmed) {
      elements.push(<div key={`empty-${lineIdx}`} className="h-2" />)
    } else {
      elements.push(
        <p key={`p-${lineIdx}`} className="leading-relaxed my-0.5 whitespace-pre-wrap">
          {renderFormattedInline(trimmed)}
        </p>
      )
    }
  })

  // Flush remaining
  flushBullets('end')
  flushNumbers('end')

  return (
    <div className={`font-sans text-xs ${className}`}>
      {elements}

      {/* Fullscreen Lightbox Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation()
            setPreviewImage(null)
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-3 py-1.5 text-zinc-300 border-b border-zinc-800">
              <span className="text-xs font-semibold truncate max-w-md">{previewImage.alt}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center">
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
