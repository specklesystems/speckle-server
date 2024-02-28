import {
  DocumentInfo,
  DocumentModelStore
} from '~/lib/bindings/definitions/IBasicConnectorBinding'
import { IModelCard, ModelCardProgress } from 'lib/models/card'
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
    model.latestCreatedVersionId = undefined
    model.error = undefined
    model.progress = { status: 'Starting to send...' }
    model.expired = false
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

  const setModelCreatedVersionId = (args: {
    modelCardId: string
    versionId: string
  }) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as ISenderModelCard
    model.latestCreatedVersionId = args.versionId
    model.progress = undefined
  }

  app.$sendBinding.on('setModelCreatedVersionId', setModelCreatedVersionId)

  /// RECEIVE STUFF
  const receiveModel = async (modelCardId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === modelCardId
    ) as IReceiverModelCard
    model.receiveResult = undefined
    model.error = undefined
    model.hasDismissedUpdateWarning = true
    model.progress = { status: 'Starting to receive...' }
    await app.$receiveBinding.receive(modelCardId)
  }

  const receiveModelCancel = async (modelCardId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === modelCardId
    ) as IReceiverModelCard
    await app.$receiveBinding.cancelReceive(modelCardId)
    model.progress = undefined
  }

  const setModelReceiveResult = async (args: {
    modelCardId: string
    receiveResult: {
      bakedObjectIds: string[]
      display: boolean
    }
  }) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as IReceiverModelCard

    console.log(args)
    model.progress = undefined
    await patchModel(model.modelCardId, { receiveResult: args.receiveResult }) // NOTE: going through this method to ensure state sync between FE and BE. It's because of a very weird rhino bug on first receives, ask dim and he will cry
  }

  app.$receiveBinding.on('setModelReceiveResult', setModelReceiveResult)

  // GENERIC STUFF
  const handleModelProgressEvents = (args: {
    modelCardId: string
    progress?: ModelCardProgress
  }) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as IModelCard
    model.progress = args.progress
  }

  const handleModelError = (args: { modelCardId: string; error: string }) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as IModelCard
    model.progress = undefined
    model.error = args.error
  }

  // NOTE: all bindings that need to send these model events should register.
  // EG, new binding "mapper binding" wants to send errors to the model card should
  // be registed here. Why? Each binding gets its own "bridge" parent in .NET, which
  // is hoisted as a separate global js object.
  app.$sendBinding.on('setModelProgress', handleModelProgressEvents)
  app.$receiveBinding.on('setModelProgress', handleModelProgressEvents)

  app.$sendBinding.on('setModelError', handleModelError)
  app.$receiveBinding.on('setModelError', handleModelError)
  app.$baseBinding.on('setModelError', handleModelError)

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
    refreshSendFilters,
    setModelCreatedVersionId,
    setModelReceiveResult,
    handleModelProgressEvents
  }
})
