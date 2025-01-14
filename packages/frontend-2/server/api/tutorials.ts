import { ensureError } from '@speckle/shared'
import imageUrlBuilder from '@sanity/image-url'
import dayjs from 'dayjs'
import type { SanityDocument, Reference } from '@sanity/types'
import type { TutorialItem } from '~/lib/dashboard/helpers/types'

export interface SanityBlogPost extends SanityDocument {
  title: string
  publishedAt: string
  mainImage?: {
    asset: Reference
  }
  url: string
}

export default defineEventHandler(async (): Promise<TutorialItem[]> => {
  const imageBuilder = imageUrlBuilder({
    projectId: '6kukgozu',
    dataset: 'production'
  })

  const currentDate = dayjs().format('YYYY-MM-DD')
  const query = encodeURIComponent(
    '*[_type == "blogPost"] | order(publishedAt desc)[0...8]'
  )
  const url = `https://6kukgozu.api.sanity.io/v${currentDate}/data/query/production?query=${query}`

  try {
    const response = await fetch(url)
    const data = (await response.json()) as { result: SanityBlogPost[] }

    if (!response.ok) {
      const errMsg = `Sanity API Error: ${response.status} ${response.statusText}`
      throw createError({
        statusCode: response.status,
        fatal: true,
        message: errMsg
      })
    }

    return data.result.map((item) => ({
      title: item.title,
      publishedAt: item.publishedAt,
      image: item.mainImage
        ? imageBuilder.image(item.mainImage).width(600).height(300).fit('fillmax').url()
        : undefined,
      id: item._id,
      url: item.url
    }))
  } catch (e) {
    const errMsg = ensureError(e).message
    throw createError({
      statusCode: 500,
      fatal: true,
      message: `Error fetching tutorial items: ${errMsg}`
    })
  }
})
