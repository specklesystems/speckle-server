import {
  DocumentInfo,
  DocumentModelStore
} from '~/lib/bindings/definitions/IBasicConnectorBinding'
import { IModelCard } from 'lib/models/card'
import { IReceiverModelCard } from 'lib/models/card/receiver'
import { ISendFilter, ISenderModelCard } from 'lib/models/card/send'
import { useMutation } from '@vue/apollo-composable'
import { createCommitMutation } from '~/lib/graphql/mutationsAndQueries'
import { useAccountStore } from '~/store/accounts'
import { ModelCardNotification } from '~/lib/models/card/notification'
import { ModelCardProgress } from '~/lib/models/card/progress'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  senders: ISenderModelCard[]
  receivers: IReceiverModelCard[]
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const useHostAppStore = defineStore('hostAppStore', () => {
  const app = useNuxtApp()
  const accStore = useAccountStore()
  accStore.provideClients()

  const hostAppName = ref<string>()
  const documentInfo = ref<DocumentInfo>()
  const documentModelStore = ref<DocumentModelStore>({ models: [] })
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
   * The host app's available send filters.
   */
  const sendFilters = ref<ISendFilter[]>()
  /**
   * Selection filter shortcut - use it as a default if possible.
   */
  const selectionFilter = computed(
    () => sendFilters.value?.find((f) => f.name === 'Selection') as ISendFilter
  )
  const everythingFilter = computed(
    () => sendFilters.value?.find((f) => f.name === 'Everything') as ISendFilter
  )

  /**
   * Adds a new model and persists it to the host app file.
   * @param model
   */
  const addModel = async (model: IModelCard) => {
    await app.$baseBinding.addModel(model)
    documentModelStore.value.models.push(model)
  }

  /**
   * Updates a model's filter, and persists that change in the host app file.
   * @param modelId
   * @param filter
   */
  const updateModelFilter = async (modelId: string, filter: ISendFilter) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as ISenderModelCard
    model.sendFilter = filter

    await app.$baseBinding.updateModel(model)
  }

  /**
   * Removes a model from the store and the host app file.
   * @param model
   */
  const removeModel = async (model: IModelCard) => {
    await app.$baseBinding.removeModel(model)
    documentModelStore.value.models = documentModelStore.value.models.filter(
      (item) => item.id !== model.id
    )
  }

  /**
   * Removes a model card's notification.
   * @param modelId
   * @param index
   */
  const dismissModelNotification = (modelId: string, index: number) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as IModelCard
    model.notifications?.splice(index, 1)
  }

  const invalidateReceiver = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as IReceiverModelCard
    await app.$receiveBinding.invalidate(modelId)
  }

  /**
   * Tells the host app to start sending a specific model card. This will reach inside the host application.
   * @param modelId
   */
  const sendModel = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as ISenderModelCard
    model.notifications = []

    await app.$sendBinding.send(modelId)
  }

  /**
   * Cancels a model card's ongoing send operation. This will reach inside the host application.
   * @param modelId
   */
  const sendModelCancel = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as ISenderModelCard
    model.progress = undefined
    await app.$sendBinding.cancelSend(modelId)
  }

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

  const getHostAppName = async () =>
    (hostAppName.value = await app.$baseBinding.getSourceApplicationName())

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

  app.$sendBinding.on('filtersNeedRefresh', () => void refreshSendFilters())

  /**
   * Reacts to the host app's change detection and marks affected sender model cards as epxired.
   */
  app.$sendBinding.on('sendersExpired', (senderIds) => {
    documentModelStore.value.models
      .filter((m) => senderIds.includes(m.id))
      .forEach((model) => {
        model.notifications = []
        model.notifications.push({
          modelCardId: model.id,
          level: 'info',
          dismissible: false,
          text: 'Model is out of sync with file.',
          cta: {
            name: 'Update',
            action: () => sendModel(model.id)
          }
        })
      })
  })

  app.$sendBinding.on('notify', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.modelCardId
    ) as ISenderModelCard

    console.log(args)
    model.notifications = !model.notifications ? [] : model.notifications
    model.notifications?.push(args)
    console.log(model.notifications)
  })

  app.$receiveBinding.on('notify', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.modelCardId
    ) as IReceiverModelCard
    model.notifications?.push(args)
  })

  // Hanlde progress events
  const progressHanlder = (args: ModelCardProgress) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.id
    ) as IModelCard

    if (args.status === 'Completed' || args.status === 'Cancelled') {
      model.progress = undefined
      return
    }

    model.progress = args
  }
  // NOTE: we should probably have only one progress event, but it's too much of a refactor in the .net part
  app.$sendBinding.on('senderProgress', progressHanlder)
  app.$receiveBinding.on('receiverProgress', progressHanlder)

  app.$sendBinding.on('createVersion', async (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.modelCardId
    ) as ISenderModelCard
    const acc = accStore.accounts.find((acc) => acc.accountInfo.id === model?.accountId)

    model.progress = {
      id: model.id,
      status: 'Creating a version...'
    }

    const { mutate: createCommit } = useMutation(createCommitMutation, {
      clientId: model?.accountId
    })

    const result = await createCommit({
      commit: {
        streamId: model?.projectId as string,
        branchName: model?.modelId as string, // NOTE: creating a new version by speccing a branch id rather than a name relies on a previous hack serverside (ask gergo)
        objectId: args.objectId,
        sourceApplication: hostAppName.value || 'dui3'
      }
    })

    model.progress = undefined
    const notification: ModelCardNotification = {
      modelCardId: args.modelCardId,
      text: 'New version created!',
      level: 'success',
      dismissible: true,
      cta: {
        name: 'View',
        action: () => {
          app.$baseBinding.openUrl(
            `${acc?.accountInfo.serverInfo.url}/projects/${model?.projectId}/models/${model.modelId}@${result?.data?.commitCreate}`
          )
        }
      }
    }

    model.notifications = [notification]
  })

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
    updateModelFilter,
    removeModel,
    dismissModelNotification,
    sendModel,
    receiveModel,
    sendModelCancel,
    receiveModelCancel,
    invalidateReceiver,
    refreshSendFilters
  }
})
