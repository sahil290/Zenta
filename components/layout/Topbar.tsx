'use client'

import { useState, useEffect } from 'react'

interface TopbarProps {
  greeting?: string
  subtitle?: string
  onRunAgent?: () => void
}

export function Topbar({ greeting, subtitle, onRunAgent }: TopbarProps) {
  const [search, setSearch] = useState('')
  const [timeGreeting, setTimeGreeting] = useState('Good morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 12 && hour < 17) setTimeGreeting('Good afternoon')
    else if (hour >= 17) setTimeGreeting('Good evening')
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{greeting ?? `${timeGreeting}, James 👋`}</h1>
        <p className="topbar-sub">{subtitle ?? 'Your agent is ready to work'}</p>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="topbar-search-input"
          />
        </div>
        <button className="btn-primary" onClick={onRunAgent}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Run agent
        </button>
      </div>
    </header>
  )
}