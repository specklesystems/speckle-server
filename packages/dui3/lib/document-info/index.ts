import { DocumentInfo } from '~/lib/bindings/definitions/baseBindings'
import { ref } from 'vue'

const DocumentInfoInjectionKey = 'DUI_DOC_INFO_STATE'

export function useDocumentInfoSetup() {
  const app = useNuxtApp()
  const documentInfo = ref<DocumentInfo>()

  app.$baseBinding?.on('documentChanged', () => {
    setTimeout(async () => {
      const docInfo = await app.$baseBinding.getDocumentInfo()
      documentInfo.value = docInfo
    }, 500) // Rhino needs some time.
  })
  ;(async () => (documentInfo.value = await app.$baseBinding.getDocumentInfo()))()
  provide(DocumentInfoInjectionKey, documentInfo)
  return documentInfo
}

export function useInjectedDocumentInfo() {
  const documentInfo = inject<Ref<DocumentInfo>>(DocumentInfoInjectionKey)
  return documentInfo
}
