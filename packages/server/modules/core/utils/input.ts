import sanitizeHtml from 'sanitize-html'

export const sanitizeUserInput = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === 'string' ? sanitizeHtml(value) : value
    ])
  ) as T
