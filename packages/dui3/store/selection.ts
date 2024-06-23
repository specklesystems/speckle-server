import { defineStore } from 'pinia'
import type { SelectionInfo } from '~/lib/bindings/definitions/ISelectionBinding'

export const useSelectionStore = defineStore('selectionStore', () => {
  const { $selectionBinding } = useNuxtApp()
  const hasBinding = ref(!!$selectionBinding)

  const selectionInfo = ref<SelectionInfo>({
    summary: 'Nothing selected',
    selectedObjectIds: [] as string[]
  })

  $selectionBinding?.on('setSelection', (selInfo) => {
    selectionInfo.value = selInfo
  })

  const refreshSelectionFromHostApp = async () => {
    if (!hasBinding.value) {
      console.warn('No selection bidings present. This will do nothing!')
      return
    }
    const selInfo = await $selectionBinding.getSelection()
    selectionInfo.value = selInfo
  }

  return { hasBinding, selectionInfo, refreshSelectionFromHostApp }
})
