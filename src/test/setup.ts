// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (window as any).location
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).location = {
  origin: 'http://localhost:3000',
  pathname: '/spicy-techs/',
  search: '',
  hash: '',
}

// Mock crypto.randomUUID if not available
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).crypto = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((globalThis as any).crypto || {}),
    randomUUID: () => {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    },
  }
}
