import {
  DocumentInfo,
  DocumentModelStore,
  IModelCard,
  IReceiverModelCard
} from 'lib/bindings/definitions/IBasicConnectorBinding'
import { ISendFilter, ISenderModelCard } from 'lib/bindings/definitions/ISendBinding'
import { useCreateVersion } from '~/lib/graphql/composables'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  senders: ISenderModelCard[]
  receivers: IReceiverModelCard[]
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const useHostAppStore = defineStore('hostAppStore', () => {
  const app = useNuxtApp()

  const documentInfo = ref<DocumentInfo>()
  const documentModelStore = ref<DocumentModelStore>({ models: [] })
  const projectModelGroups = computed(() => {
    const projectModelGroups: ProjectModelGroup[] = []
    for (const model of documentModelStore.value.models) {
      let project = projectModelGroups.find((p) => p.projectId === model.projectId)
      if (!project) {
        project = {
          projectId: model.projectId,
          accountId: model.accountId,
          senders: [],
          receivers: []
        }
        projectModelGroups.push(project)
      }
      if (model.typeDiscriminator.toLowerCase().includes('sender'))
        project.senders.push(model as ISenderModelCard)
      if (model.typeDiscriminator.toLowerCase().includes('receiver'))
        project.receivers.push(model as IReceiverModelCard)
    }
    return projectModelGroups
  })

  const sendFilters = ref<ISendFilter[]>()
  const selectionFilter = computed(() =>
    sendFilters.value?.find((f) => f.name === 'Selection')
  )

  const everythingFilter = computed(() =>
    sendFilters.value?.find((f) => f.name === 'Everything')
  )

  const addModel = async (model: IModelCard) => {
    await app.$baseBinding.addModel(model)
    documentModelStore.value.models.push(model)
  }

  const updateModelFilter = async (modelId: string, filter: ISendFilter) => {
    const modelIndex = documentModelStore.value.models.findIndex(
      (m) => m.id === modelId
    )
    const model = documentModelStore.value.models[modelIndex] as ISenderModelCard
    model.sendFilter = filter

    await app.$baseBinding.updateModel(documentModelStore.value.models[modelIndex])
  }

  const removeModel = (modelId: string) => {
    //TODO
    console.log(`Should remove ${modelId}`)
  }

  const sendModel = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as ISenderModelCard
    model.expired = false
    model.sending = true
    await app.$sendBinding.send(modelId)
  }

  const sendModelCancel = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as ISenderModelCard
    model.sending = false
    model.progress = undefined
    await app.$sendBinding.cancelSend(modelId)
  }

  const refreshDocumentInfo = async () =>
    (documentInfo.value = await app.$baseBinding.getDocumentInfo())

  const refreshDocumentModelStore = async () =>
    (documentModelStore.value = await app.$baseBinding.getDocumentState())

  const refreshSendFilters = async () =>
    (sendFilters.value = await app.$sendBinding?.getSendFilters())

  app.$baseBinding.on(
    'documentChanged',
    () =>
      setTimeout(() => {
        void refreshDocumentInfo()
        void refreshDocumentModelStore()
        void refreshSendFilters()
      }, 500) // timeout exists because of rhino
  )

  app.$sendBinding?.on('filtersNeedRefresh', () => void refreshSendFilters())

  app.$sendBinding?.on('sendersExpired', (senderIds) => {
    documentModelStore.value.models
      .filter((m) => senderIds.includes(m.id))
      .forEach((model) => ((model as ISenderModelCard).expired = true))
  })

  app.$sendBinding.on('senderProgress', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.id
    ) as ISenderModelCard
    model.progress = args
  })

  app.$sendBinding.on('createVersion', async (args) => {
    const createVersion = useCreateVersion(args.accountId)
    await createVersion(args)
  })

  // First initialization calls
  void refreshDocumentInfo()
  void refreshDocumentModelStore()
  void refreshSendFilters()

  return {
    documentInfo,
    projectModelGroups,
    sendFilters,
    selectionFilter,
    everythingFilter,
    addModel,
    updateModelFilter,
    removeModel,
    sendModel,
    sendModelCancel,
    refreshSendFilters
  }
})
