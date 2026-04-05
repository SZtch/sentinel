'use client'

interface UserBarProps {
  displayName: string | undefined
  isGuest: boolean
  onSignOut: () => void
}

export function UserBar({ displayName, isGuest, onSignOut }: UserBarProps) {
  return (
    <div className="user-info">
      <span className="user-name">{displayName}</span>
      <span className="info-sep">·</span>
      {isGuest ? (
        <a className="ghost-btn" href="/">sign in</a>
      ) : (
        <button className="ghost-btn" onClick={onSignOut}>
          sign out
        </button>
      )}
    </div>
  )
}
