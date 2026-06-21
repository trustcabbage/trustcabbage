'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const mdComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  h1: ({ children }: any) => <h2 className="text-lg font-black mt-3 mb-1">{children}</h2>,
  h2: ({ children }: any) => <h3 className="font-black mt-3 mb-1">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }: any) => <li>{children}</li>,
}

export function ExpandableDescription({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 160

  return (
    <div>
      <div className={`${className ?? ''} ${isLong && !expanded ? 'max-h-[5em] overflow-hidden' : ''}`}>
        <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-black text-[#6d28d9] hover:text-[#7c3aed] mt-1 transition-colors"
        >
          {expanded ? 'See less ↑' : 'See more ↓'}
        </button>
      )}
    </div>
  )
}
