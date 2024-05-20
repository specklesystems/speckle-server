import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'

const base64ImagePattern = /^data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/]+=*$/

const validateImageUrl = (url: string): string => {
  // Parse the URL to ensure it's valid
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch (e) {
    throw new Error('Invalid URL')
  }

  // Only allow http: and https: protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Invalid protocol')
  }

  // Check the file extension to ensure it's an image
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
  const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || 'invalid'
  if (!allowedExtensions.includes(extension)) {
    throw new Error('Invalid file type')
  }

  // If all checks pass, return the sanitized URL
  return parsedUrl.href
}

/**
 * Ensure that image refers to a valid image URL or a base64 data string
 */
export const sanitizeImageUrl = (
  image: MaybeNullOrUndefined<string>
): Nullable<string> => {
  if (!image?.length) return null

  // If the image is a base64 string, return it as is
  if (base64ImagePattern.test(image)) return image

  try {
    return validateImageUrl(image)
  } catch (e) {
    // invalid url
  }

  return null
}
