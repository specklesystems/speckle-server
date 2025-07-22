export const isValidBase64Image = (data: string): boolean => {
  if (!data.startsWith('data:image/')) return false

  const parts = data.split(',')
  if (parts.length !== 2) return false

  const base64String = parts[1]

  // Check if base64 string is valid
  try {
    const buffer = Buffer.from(base64String, 'base64')
    // Optionally check that re-encoding it gives the same result (sanity check)
    return buffer.toString('base64') === base64String.replace(/\s/g, '')
  } catch {
    return false
  }
}
