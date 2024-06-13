declare global {
  interface Window {
    send: typeof import('../../index').send
    loadData: () => Promise<void>
  }
}

export {}
