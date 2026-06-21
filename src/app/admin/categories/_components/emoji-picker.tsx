'use client'

import { useState } from 'react'

const EMOJIS = [
  '💳','💰','🏦','🚚','📦','💼','🏪','🧾','📱','💻',
  '🌐','🔒','📊','🎯','🤝','📋','⚙️','🏥','🎓','🍽️',
  '✈️','🏠','🚗','📸','🎬','💡','🔧','🌿','🛒','🏗️',
  '📢','🖨️','☁️','🔐','🧑‍💼','📝','🎪','🧪','🔬','🏆',
]

export function EmojiPicker({ defaultValue = '', name }: { defaultValue?: string; name: string }) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-2">
        <div
          onClick={() => setOpen(o => !o)}
          className="flex items-center justify-center h-10 w-14 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-[#6d28d9] transition-colors text-2xl select-none"
          title="Click to pick emoji"
        >
          {value || <span className="text-slate-300 text-base">+</span>}
        </div>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Paste or type emoji"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9]"
        />
        {value && (
          <button type="button" onClick={() => setValue('')} className="text-slate-400 hover:text-slate-700 px-2 text-lg">×</button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 top-12 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-72">
          <div className="grid grid-cols-10 gap-1">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => { setValue(e); setOpen(false) }}
                className="text-xl h-8 w-8 flex items-center justify-center rounded-lg hover:bg-violet-50 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">Or type/paste any emoji in the input above</p>
        </div>
      )}
    </div>
  )
}
