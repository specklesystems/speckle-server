import { ensureError } from '@speckle/shared'
import type { WebflowItem } from '~/lib/dashboard/helpers/types'

type WebflowApiResponse = {
  items: Array<{
    id: string
    lastPublished: string
    createdOn: string
    fieldData: {
      name: string
      slug: string
      'feature-image'?: {
        url: string
      }
      html?: string
    }
  }>
}

const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 280
  const wordCount = content.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Used to filter to last 6 months' articles to prevent old,
// recently edited posts from appearing at the top
const getSixMonthsAgo = (): Date => {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  return date
}

export default defineEventHandler(async (): Promise<{ items: WebflowItem[] }> => {
  const { webflowApiToken } = useRuntimeConfig()
  const logger = useLogger()

  if (!webflowApiToken) {
    logger.info('Webflow API token is not set. Returning an empty array of items.')
    return { items: [] }
  }

  const url =
    'https://api.webflow.com/v2/collections/66d822d3199be6f73a6c3c2c/items?limit=16&sortBy=lastPublished&sortOrder=desc'

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${webflowApiToken}`,
        'accept-version': '2.0.0'
      }
    })

    if (!response.ok) {
      const errMsg = `Webflow API Error: ${response.status} ${response.statusText}`
      throw createError({
        statusCode: response.status,
        fatal: true,
        message: errMsg
      })
    }

    const data = (await response.json()) as WebflowApiResponse

    const sixMonthsAgo = getSixMonthsAgo()

    const filteredItems = data.items
      .filter((item) => new Date(item.createdOn) > sixMonthsAgo)
      .sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime())
      .slice(0, 8) // Take only the first 8 items after filtering and sorting

    return {
      items: filteredItems.map(
        (item): WebflowItem => ({
          id: item.id,
          title: item.fieldData.name,
          createdOn: item.createdOn,
          lastPublished: item.lastPublished,
          featureImageUrl: item.fieldData['feature-image']?.url,
          url: `https://speckle.systems/blog/${item.fieldData.slug}`,
          readTime: item.fieldData.html
            ? calculateReadTime(item.fieldData.html)
            : undefined
        })
      )
    }
  } catch (e) {
    const errMsg = ensureError(e).message
    throw createError({
      statusCode: 500,
      fatal: true,
      message: `Error fetching webflow items: ${errMsg}`
    })
  }
})
