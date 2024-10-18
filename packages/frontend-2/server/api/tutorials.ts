import type { TutorialItem } from '~/lib/dashboard/helpers/types'

type WebflowApiResponse = {
  items: Array<{
    id: string
    lastPublished: string
    fieldData: {
      name: string
      slug: string
      'feature-image'?: {
        url: string
      }
    }
  }>
}

export default defineEventHandler(async (): Promise<{ items: TutorialItem[] }> => {
  const { webflowApiToken } = useRuntimeConfig()
  const logger = useLogger()

  const url = new URL(
    `https://api.webflow.com/v2/collections/66d822d3199be6f73a6c3c2c/items`
  )
  url.searchParams.append('limit', '8')
  url.searchParams.append('sortBy', 'lastPublished')
  url.searchParams.append('sortOrder', 'desc')

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${webflowApiToken}`,
        'accept-version': '2.0.0'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: response.statusText
      })
    }

    const data = (await response.json()) as WebflowApiResponse

    return {
      items: data.items.map(
        (item): TutorialItem => ({
          id: item.id,
          title: item.fieldData.name,
          lastPublished: item.lastPublished,
          featureImageUrl: item.fieldData['feature-image']?.url,
          url: `https://speckle.systems/blog/${item.fieldData.slug}`
        })
      )
    }
  } catch (error) {
    logger.error('Error fetching tutorials:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching tutorials'
    })
  }
})
