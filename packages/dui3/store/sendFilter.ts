import { ISendFilter } from 'lib/bindings/definitions/IBasicConnectorBinding'

export const useSendFilterStore = defineStore('sendFilterStore', () => {
  const app = useNuxtApp()
  const sendFilters = ref<ISendFilter[]>()

  const selectionFilter = computed(() =>
    sendFilters.value?.find((f) => f.name === 'Selection')
  )
  const everythingFilter = computed(() =>
    sendFilters.value?.find((f) => f.name === 'Everything')
  )

  const updateSendFilters = async () => {
    const res = await app.$baseBinding.getSendFilters()
    console.log(res)
    sendFilters.value = res
  }

  app.$baseBinding.on('documentChanged', () => {
    console.log('doc changed in filter store')
    setTimeout(() => {
      void updateSendFilters()
    }, 500)
  })

  app.$baseBinding.on('filtersNeedRefresh', () => {
    void updateSendFilters()
  })

  void updateSendFilters()

  return { sendFilters, selectionFilter, everythingFilter, updateSendFilters }
})
