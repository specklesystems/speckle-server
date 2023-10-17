import { MaybeRef } from '@vueuse/core'
import { MaybeNullOrUndefined } from '@speckle/shared'
import { CSSProperties } from 'vue'
import { UploadFileItem, UploadableFileItem } from '@speckle/ui-components'

export type { UploadFileItem, UploadableFileItem }

export function useFileUploadProgressCore(params: {
  item: MaybeRef<MaybeNullOrUndefined<UploadFileItem>>
}) {
  const errorMessage = computed(() => {
    const item = unref(params.item)
    if (!item) return null

    const itemError = item.error
    if (itemError) return itemError.message

    const uploadError = item.result?.uploadError
    if (uploadError) return uploadError

    return null
  })

  const progressBarColorClass = computed(() => {
    const item = unref(params.item)
    if (errorMessage.value) return 'bg-danger'
    if (item && item.progress >= 100) return 'bg-success'
    return 'bg-primary'
  })

  const progressBarClasses = computed(() => {
    return ['h-1', progressBarColorClass.value].join(' ')
  })

  const progressBarStyle = computed((): CSSProperties => {
    const item = unref(params.item)
    return {
      width: `${item ? item.progress : 0}%`
    }
  })

  return { errorMessage, progressBarClasses, progressBarStyle }
}
