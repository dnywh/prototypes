import { MoreHorizontal, Pencil, Share2, Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { standup } from '../model/standup'
import { SupabaseLogo } from './SupabaseLogo'

const menuItems = [
  { label: 'Share standup', icon: Share2 },
  { label: 'Reschedule', icon: Timer },
  { label: 'Edit goals', icon: Pencil },
]

export function AppHeader() {
  const [opacity, setOpacity] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setOpacity(Math.max(0, 1 - window.scrollY / 120))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 w-full" style={{ opacity }}>
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2.5">
          <SupabaseLogo className="size-[18px] shrink-0" />
          <span className="truncate text-[13px] font-medium text-fg">Meridian Marketplace</span>
          <span className="hidden text-fg-faint sm:inline">·</span>
          <span className="hidden truncate text-[12px] text-fg-muted sm:inline">
            {standup.date}
          </span>
        </div>

        <div ref={menuRef} className="pointer-events-auto relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Standup options"
            className="wv-focus-ring flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-elevated/80 hover:text-fg"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 min-w-[180px] rounded-[var(--radius-panel)] border border-border bg-panel py-1 shadow-lg"
            >
              {menuItems.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="wv-focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-fg-light transition-colors hover:bg-elevated"
                >
                  <Icon className="size-3.5 text-fg-muted" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
