import { DocumentInfo } from 'lib/bindings/definitions/IBasicConnectorBinding'

export const useDocumentInfoStore = defineStore('documentInfoStore', () => {
  const app = useNuxtApp()
  const documentInfo = ref<DocumentInfo>({ location: 'pasta', id: 'nuuu', name: 'aa' })

  app.$baseBinding.on('documentChanged', () => {
    setTimeout(async () => {
      const docInfo = await app.$baseBinding.getDocumentInfo()
      documentInfo.value = docInfo
    }, 500) // Rhino needs some time.
  })

  const initDocInfo = async () => {
    documentInfo.value = await app.$baseBinding.getDocumentInfo()
  }

  void initDocInfo()

  return { documentInfo }
})
