import sanitizeHtml from 'sanitize-html'

export const sanitizeString = <T extends string | null | undefined>(
  dirty: T,
  options: { stripAll?: boolean } = {}
): T => {
  const { stripAll = false } = options
  // preserve null and undefined
  if (dirty === undefined || dirty === null) return dirty
  return sanitizeHtml(dirty, {
    allowedTags: stripAll ? [] : ['b', 'i', 'em', 'strong']
  }) as T
}
