import type { Nullable } from '@speckle/shared'

/* 
  The Ghost API by default return huge images without any option to specify the format.
  This can causes the images to take a long time to load.
  Works around this issue by adding 'size' to the URL to request a smaller image
*/
export const getResizedGhostImage = ({
  url,
  width
}: {
  url?: Nullable<string>
  width: number
}): string | null => {
  if (!url) return null

  const pathParts = url.split('/')
  const sizeSegment = `size/w${width}`
  const imagesIndex = pathParts.indexOf('images')

  if (imagesIndex !== -1) {
    // Should always be there, but just the be sure in case it's an unexpected formatted URL
    pathParts.splice(imagesIndex + 1, 0, sizeSegment)
    url = pathParts.join('/')
  }

  return url
}
