import type {
  DocumentInfo,
  DocumentModelStore
} from '~/lib/bindings/definitions/IBasicConnectorBinding'
import type { IModelCard, ModelCardProgress } from 'lib/models/card'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import type { IReceiverModelCard } from '~/lib/models/card/receiver'
import type {
  IDirectSelectionSendFilter,
  ISendFilter,
  ISenderModelCard
} from 'lib/models/card/send'
import type { ToastNotification } from '@speckle/ui-components'
import type { Nullable } from '@speckle/shared'
import type { HostAppError } from '~/lib/bridge/errorHandler'
import type { ConversionResult } from 'lib/conversions/conversionResult'
import { defineStore } from 'pinia'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  senders: ISenderModelCard[]
  receivers: IReceiverModelCard[]
}

export const useHostAppStore = defineStore('hostAppStore', () => {
  const app = useNuxtApp()
  const { trackEvent } = useMixpanel()

  const currentNotification = ref<Nullable<ToastNotification>>(null)
  const showErrorDialog = ref<boolean>(false)
  const hostAppError = ref<Nullable<HostAppError>>(null)

  const hostAppName = ref<string>()
  const hostAppVersion = ref<string>()
  const connectorVersion = ref<string>()
  const documentInfo = ref<DocumentInfo>()
  const documentModelStore = ref<DocumentModelStore>({ models: [] })

  const dismissNotification = () => {
    currentNotification.value = null
  }

  const setNotification = (notification: Nullable<ToastNotification>) => {
    currentNotification.value = notification
  }

  const setHostAppError = (error: Nullable<HostAppError>) => {
    hostAppError.value = error
  }

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

  const models = computed(() => {
    return documentModelStore.value.models
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

    void trackEvent(
      'DUI3 Action',
      { name: 'Remove Model Card', type: model.typeDiscriminator },
      model.accountId
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

  app.$selectionBinding?.on('setSelection', (selInfo) => {
    const modelCards = models.value.filter(
      (m) =>
        m.typeDiscriminator.toLowerCase().includes('sender') &&
        (m as ISenderModelCard).sendFilter?.name === 'Selection'
    ) as ISenderModelCard[]

    for (const model of modelCards) {
      const filter = model.sendFilter as IDirectSelectionSendFilter
      if (selInfo.selectedObjectIds.length === 0) {
        filter.expired = false
        continue
      }
      const a1 = filter.selectedObjectIds.sort().join()
      const a2 = selInfo.selectedObjectIds.sort().join()

      filter.expired = a1 !== a2
      // filter.expired =
      //   filter.selectedObjectIds.filter((id) => !selInfo.selectedObjectIds.includes(id))
      //     .length !== 0
    }
  })

  /**
   * Everything filter shortcut - do not use it as a default.
   */
  const everythingFilter = computed(
    () => sendFilters.value?.find((f) => f.name === 'Everything') as ISendFilter
  )

  /**
   * Subscribe to notifications about send filters.
   */
  app.$sendBinding?.on('refreshSendFilters', () => void refreshSendFilters())

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
    if (model.expired) {
      // user sends via "Update" button
      void trackEvent('DUI3 Action', { name: 'Send', expired: true }, model.accountId)
    } else {
      void trackEvent('DUI3 Action', { name: 'Send', expired: false }, model.accountId)
    }
    model.latestCreatedVersionId = undefined
    model.error = undefined
    model.progress = { status: 'Starting to send...' }
    model.expired = false
    model.report = undefined

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
    void trackEvent('DUI3 Action', { name: 'Send Cancel' }, model.accountId)
    model.latestCreatedVersionId = undefined
  }

  app.$sendBinding?.on('setModelsExpired', (modelCardIds) => {
    documentModelStore.value.models
      .filter((m) => modelCardIds.includes(m.modelCardId))
      .forEach((model: ISenderModelCard) => {
        model.latestCreatedVersionId = undefined
        model.error = undefined
        model.expired = true
      })
  })

  const setModelSendResult = (args: {
    modelCardId: string
    versionId: string
    sendConversionResults: ConversionResult[]
  }) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as ISenderModelCard
    model.latestCreatedVersionId = args.versionId
    model.report = args.sendConversionResults
    model.progress = undefined
  }

  app.$sendBinding?.on('setModelSendResult', setModelSendResult)

  /// RECEIVE STUFF
  const receiveModel = async (modelCardId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === modelCardId
    ) as IReceiverModelCard

    void trackEvent(
      'DUI3 Action',
      { name: 'Receive', expired: model.expired },
      model.accountId
    )

    model.report = undefined
    model.error = undefined
    model.displayReceiveComplete = false
    model.hasDismissedUpdateWarning = true
    model.progress = { status: 'Starting to receive...' }
    await app.$receiveBinding.receive(modelCardId)
  }

  const receiveModelCancel = async (modelCardId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === modelCardId
    ) as IReceiverModelCard
    await app.$receiveBinding.cancelReceive(modelCardId)
    void trackEvent('DUI3 Action', { name: 'Receive Cancel' }, model.accountId)
    model.progress = undefined
  }

  const setModelReceiveResult = async (args: {
    modelCardId: string
    bakedObjectIds: string[]
    conversionResults: ConversionResult[]
  }) => {
    const model = documentModelStore.value.models.find(
      (m) => m.modelCardId === args.modelCardId
    ) as IReceiverModelCard

    model.progress = undefined
    model.displayReceiveComplete = true
    model.bakedObjectIds = args.bakedObjectIds
    model.report = args.conversionResults

    // NOTE: going through this method to ensure state sync between FE and BE. It's because of a very weird rhino bug on first receives, ask dim and he will cry
    // TODO: check if it's still needed - we can store the bakedobject ids straigth into the receive ops in .net. Is the above reproducible?
    await patchModel(model.modelCardId, {
      bakedObjectIds: args.bakedObjectIds
    })
  }

  app.$receiveBinding?.on('setModelReceiveResult', setModelReceiveResult)

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

  const setModelError = (args: { modelCardId: string; error: string }) => {
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
  app.$sendBinding?.on('setModelProgress', handleModelProgressEvents)
  app.$receiveBinding?.on('setModelProgress', handleModelProgressEvents)

  app.$baseBinding?.on('setGlobalNotification', setNotification)
  app.$sendBinding?.on('setGlobalNotification', setNotification)
  app.$receiveBinding?.on('setGlobalNotification', setNotification)
  app.$configBinding?.on('setGlobalNotification', setNotification)
  app.$accountBinding?.on('setGlobalNotification', setNotification)
  app.$selectionBinding?.on('setGlobalNotification', setNotification)
  app.$testBindings?.on('setGlobalNotification', setNotification)

  app.$sendBinding?.on('setModelError', setModelError)
  app.$receiveBinding?.on('setModelError', setModelError)
  app.$baseBinding.on('setModelError', setModelError)

  /**
   * Used internally in this store store only for initialisation.
   */
  const getHostAppName = async () =>
    (hostAppName.value = await app.$baseBinding.getSourceApplicationName())

  const getHostAppVersion = async () =>
    (hostAppVersion.value = await app.$baseBinding.getSourceApplicationVersion())

  const getConnectorVersion = async () =>
    (connectorVersion.value = await app.$baseBinding.getConnectorVersion())

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
        void trackEvent('DUI3 Action', { name: 'Document changed' })
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
  void getHostAppVersion()
  void getConnectorVersion()

  return {
    hostAppName,
    hostAppVersion,
    connectorVersion,
    documentInfo,
    projectModelGroups,
    models,
    sendFilters,
    selectionFilter,
    everythingFilter,
    currentNotification,
    showErrorDialog,
    hostAppError,
    setNotification,
    setModelError,
    dismissNotification,
    setHostAppError,
    addModel,
    patchModel,
    removeModel,
    sendModel,
    receiveModel,
    sendModelCancel,
    receiveModelCancel,
    refreshSendFilters,
    setModelSendResult,
    setModelReceiveResult,
    handleModelProgressEvents
  }
})
