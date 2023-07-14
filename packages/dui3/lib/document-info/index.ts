import { DocumentInfo } from '~/lib/bindings/definitions/baseBindings'
import { ref } from 'vue'

const DocumentInfoInjectionKey = 'DUI_ACCOUNTS_STATE'

export async function useDocumentInfoSetup() {
  const app = useNuxtApp()
  const documentInfo = ref<DocumentInfo>()

  app.$baseBinding.on('documentChanged', () => {
    setTimeout(async () => {
      const docInfo = await app.$baseBinding.getDocumentInfo()
      documentInfo.value = docInfo
    }, 500) // Don't ask
  })

  documentInfo.value = await app.$baseBinding.getDocumentInfo()
  provide(DocumentInfoInjectionKey, documentInfo)
  return documentInfo
}

export function useInjectedDocumentInfo() {
  const documentInfo = inject<Ref<DocumentInfo>>(DocumentInfoInjectionKey)
  return documentInfo
}
