import {
  DocumentInfo,
  DocumentModelStore
} from '~/lib/bindings/definitions/IBasicConnectorBinding'
import { IModelCard } from 'lib/models/card'
import { IReceiverModelCard } from 'lib/models/card/receiver'
import { ISendFilter, ISenderModelCard } from 'lib/models/card/send'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  senders: ISenderModelCard[]
  receivers: IReceiverModelCard[]
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const useHostAppStore = defineStore('hostAppStore', () => {
  const app = useNuxtApp()

  const hostAppName = ref<string>()
  const documentInfo = ref<DocumentInfo>()
  const documentModelStore = ref<DocumentModelStore>({ models: [] })

  /**
   * Model Card Operations
   */

  /**
   * A list of all models currently in the file, grouped by the project they are part of.
   */
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

  /**
   * Adds a new model and persists it to the host app file.
   * @param model
   */
  const addModel = async (model: IModelCard) => {
    await app.$baseBinding.addModel(model)
    documentModelStore.value.models.push(model)
  }

  /**
   * Updates a model's provided properties and persists the changes in the host application.
   * @param modelCardId
   * @param properties
   */
  const patchModel = async (
    modelCardId: string,
    properties: Record<string, unknown>
  ) => {
    const modelIndex = documentModelStore.value.models.findIndex(
      (m) => m.modelCardId === modelCardId
    )

    documentModelStore.value.models[modelIndex] = {
      ...documentModelStore.value.models[modelIndex],
      ...properties
    }
    await app.$baseBinding.updateModel(documentModelStore.value.models[modelIndex])
  }

  /**
   * Removes a model from the store and the host app file.
   * @param model
   */
  const removeModel = async (model: IModelCard) => {
    await app.$baseBinding.removeModel(model)
    documentModelStore.value.models = documentModelStore.value.models.filter(
      (item) => item.modelCardId !== model.modelCardId
    )
  }

  /**
   * Send filters
   */

  /**
   * The host app's available send filters.
   */
  const sendFilters = ref<ISendFilter[]>()

  /**
   * Selection filter shortcut - use it as a default if possible.
   */
  const selectionFilter = computed(
    () => sendFilters.value?.find((f) => f.name === 'Selection') as ISendFilter
  )

  /**
   * Everything filter shortcut - do not use it as a default.
   */
  const everythingFilter = computed(
    () => sendFilters.value?.find((f) => f.name === 'Everything') as ISendFilter
  )

  /**
   * Subscribe to notifications about send filters.
   */
  app.$sendBinding.on('refreshSendFilters', () => void refreshSendFilters())

  /**
   * Send functionality
   */

  /**
   * Tells the host app to start sending a specific model card. This will reach inside the host application.
   * @param modelId
   */
  const sendModel = (modelCardId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === modelCardId
    ) as ISenderModelCard
    model.progress = undefined
    model.expired = false
    model.error = undefined
    void app.$sendBinding.send(modelCardId)
  }

  /**
   * Cancels a model card's ongoing send operation. This will reach inside the host application.
   * @param modelId
   */
  const sendModelCancel = async (modelCardId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === modelCardId
    ) as ISenderModelCard
    await app.$sendBinding.cancelSend(modelCardId)
    model.progress = undefined
    model.error = undefined
    model.latestCreatedVersionId = undefined
  }

  app.$sendBinding.on('setModelsExpired', (modelCardIds) => {
    documentModelStore.value.models
      .filter((m) => modelCardIds.includes(m.modelCardId))
      .forEach((model: ISenderModelCard) => {
        model.latestCreatedVersionId = undefined
        model.error = undefined
        model.expired = true
      })
  })

  app.$sendBinding.on('setModelProgress', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as IModelCard
    model.progress = args.progress
  })

  app.$sendBinding.on('setModelCreatedVersionId', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as ISenderModelCard
    model.latestCreatedVersionId = args.versionId
    model.progress = undefined
  })

  app.$sendBinding.on('setModelError', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as IModelCard
    model.error = args.error
  })

  /// RECEIVE STUFF - TODO
  const receiveModel = async (modelId: string, versionId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as IReceiverModelCard
    model.receiving = true
    await app.$receiveBinding.receive(modelId, versionId)
  }

  const receiveModelCancel = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as IReceiverModelCard
    model.receiving = false
    model.progress = undefined
    await app.$receiveBinding.cancelReceive(modelId)
  }

  const invalidateReceiver = async (modelId: string) => {
    await app.$receiveBinding.invalidate(modelId)
  }

  /**
   * Used internally in this store store only for initialisation.
   */
  const getHostAppName = async () =>
    (hostAppName.value = await app.$baseBinding.getSourceApplicationName())

  /**
   * Used internally in this store store only for initialisation. Refreshed the document info from the host app. Should be called on document changed events.
   */
  const refreshDocumentInfo = async () =>
    (documentInfo.value = await app.$baseBinding.getDocumentInfo())

  /**
   * Used internally in this store store only for initialisation. Refreshes available model cards from the host app. Should be called on document changed events.
   */
  const refreshDocumentModelStore = async () =>
    (documentModelStore.value = await app.$baseBinding.getDocumentState())

  /**
   * Sources the available send filters from the app. This is useful in case of host app layer changes, etc.
   */
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

  // First initialization calls
  void refreshDocumentInfo()
  void refreshDocumentModelStore()
  void refreshSendFilters()
  void getHostAppName()

  return {
    hostAppName,
    documentInfo,
    projectModelGroups,
    sendFilters,
    selectionFilter,
    everythingFilter,
    addModel,
    patchModel,
    removeModel,
    sendModel,
    receiveModel,
    sendModelCancel,
    receiveModelCancel,
    invalidateReceiver,
    refreshSendFilters
  }
})
