type KeyType = 'search' | 'view-type' | 'sidebar-fold' | 'text-size'

function get(key: KeyType): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

function set(key: KeyType, value: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

export { get, set }
