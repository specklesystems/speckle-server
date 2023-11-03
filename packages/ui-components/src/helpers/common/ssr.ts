export const isSSR =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'
