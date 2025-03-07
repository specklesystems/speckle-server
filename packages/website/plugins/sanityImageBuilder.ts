import imageUrlBuilder from '@sanity/image-url'

export default defineNuxtPlugin(async () => {
  // NOTE: this should be extracted out
  const builder = imageUrlBuilder({
    projectId: '6kukgozu',
    dataset: 'production',
    useCdn: false
  })

  const urlForImage = (source) => {
    return builder.image(source)
  }

  return {
    provide: {
      imageUrlBuilder,
      urlForImage
    }
  }
})
