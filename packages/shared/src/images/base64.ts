export const isValidBase64Image = (data: string): boolean => {
  if (!data.startsWith('data:image/')) return false

  const parts = data.split(',')
  if (parts.length !== 2) return false

  // Remove all whitespace characters from base64 string
  const base64String = parts[1].replace(/\s+/g, '')

  // Validate that the cleaned string only has valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
  if (!base64Regex.test(base64String)) return false

  return true
}
