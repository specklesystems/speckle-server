import {
  DocumentInfo,
  DocumentModelStore
} from 'lib/bindings/definitions/IBasicConnectorBinding'
import { VersionCreateInput } from 'lib/common/generated/gql/graphql'
import { IModelCard } from 'lib/models/card'
import { ModelCardNotification } from 'lib/models/card/notification'
import { IReceiverModelCard } from 'lib/models/card/receiver'
import { ISenderModelCard, ISendFilter } from 'lib/models/card/send'
import { CardSetting, CardSettingValue } from 'lib/models/card/setting'
import { useCreateVersion } from '~/lib/graphql/composables'
import { useAccountStore } from '~~/store/accounts'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  senders: ISenderModelCard[]
  receivers: IReceiverModelCard[]
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const useHostAppStore = defineStore('hostAppStore', () => {
  const app = useNuxtApp()

  const { defaultAccount } = storeToRefs(useAccountStore())

  const hostAppName = ref<string>()
  const documentInfo = ref<DocumentInfo>()
  const sendSettings = ref<CardSetting[]>()
  const receiveSettings = ref<CardSetting[]>()
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

  const tryGetModel = (modelId: string | undefined) => {
    return documentModelStore.value.models.find((model) => model.modelId === modelId)
  }

  const addModel = async (model: IModelCard) => {
    await app.$baseBinding.addModel(model)
    documentModelStore.value.models = documentModelStore.value.models.concat([model])
  }

  const highlightModel = async (modelId: string) => {
    await app.$baseBinding.highlightModel(modelId)
  }

  const updateModelFilter = async (modelId: string, filter: ISendFilter) => {
    const modelIndex = documentModelStore.value.models.findIndex(
      (m) => m.id === modelId
    )
    const model = documentModelStore.value.models[modelIndex] as ISenderModelCard
    model.sendFilter = filter

    await app.$baseBinding.updateModel(documentModelStore.value.models[modelIndex])
  }

  type DataType = Record<string, unknown>
  const updateModelSettings = async (modelId: string, newSettings: DataType) => {
    const modelIndex = documentModelStore.value.models.findIndex(
      (m) => m.id === modelId
    )
    const model = documentModelStore.value.models[modelIndex] as IModelCard

    if (model.settings) {
      model.settings.forEach((setting) => {
        if (setting) {
          if (setting.value !== newSettings[setting.id]) {
            // console.log(
            //   'attempted to set new setting value',
            //   setting.id,
            //   newSettings[setting.id]
            // )

            setting.value = newSettings[setting.id] as CardSettingValue
          }
        }
      })
    }
    await app.$baseBinding.updateModel(documentModelStore.value.models[modelIndex])
  }

  const removeModel = async (model: IModelCard) => {
    await app.$baseBinding.removeModel(model)
    documentModelStore.value.models = documentModelStore.value.models.filter(
      (item) => item.id !== model.id
    )
  }

  const invalidateReceiver = async (modelId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as IReceiverModelCard
    model.expired = true
    await app.$receiveBinding.invalidate(modelId)
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

  const receiveModel = async (modelId: string, versionId: string) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === modelId
    ) as IReceiverModelCard
    model.expired = false
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

  const getSendSettings = async () =>
    (sendSettings.value = await app.$sendBinding.getSendSettings())

  const getReceiveSettings = async () =>
    (receiveSettings.value = await app.$receiveBinding.getReceiveSettings())

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

  app.$sendBinding?.on('filtersNeedRefresh', () => void refreshSendFilters())

  app.$sendBinding?.on('sendersExpired', (senderIds) => {
    documentModelStore.value.models
      .filter((m) => senderIds.includes(m.id))
      .forEach((model) => ((model as ISenderModelCard).expired = true))
  })

  app.$sendBinding.on('notify', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.modelCardId
    ) as ISenderModelCard
    model.notifications?.push(args)
    setTimeout(() => {
      const notification = model.notifications?.find((n) => n.id === args.id)
      const notifications = model.notifications?.filter((n) => n.id !== args.id)
      notifications?.push({ ...notification, visible: false } as ModelCardNotification)
      model.notifications = notifications
    }, args.timeout)
  })

  app.$receiveBinding.on('notify', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.modelCardId
    ) as IReceiverModelCard
    model.notifications?.push(args)

    setTimeout(() => {
      const notification = model.notifications?.find((n) => n.id === args.id)
      const notifications = model.notifications?.filter((n) => n.id !== args.id)
      notifications?.push({ ...notification, visible: false } as ModelCardNotification)
      model.notifications = notifications
    }, args.timeout)
  })

  app.$sendBinding.on('senderProgress', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.id
    ) as ISenderModelCard
    model.progress = args
    if (args.status === 'Completed') {
      model.sending = false
      model.progress = undefined
    } else if (args.status === 'Cancelled') {
      model.sending = false
      setTimeout(() => {
        model.progress = undefined
      }, 3000)
    }
  })

  app.$receiveBinding.on('receiverProgress', (args) => {
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.id
    ) as IReceiverModelCard
    model.progress = args
    if (args.status === 'Completed') {
      model.receiving = false
      model.progress = undefined
    } else if (args.status === 'Cancelled') {
      model.receiving = false
      setTimeout(() => {
        model.progress = undefined
      }, 3000)
    }
  })

  app.$sendBinding.on('createVersion', async (args) => {
    const createVersion = useCreateVersion(args.accountId)
    const version: VersionCreateInput = {
      projectId: args.projectId,
      modelId: args.modelId,
      objectId: args.objectId,
      sourceApplication: args.sourceApplication,
      message: args.message
    }
    const res = await createVersion(version)
    const notification: ModelCardNotification = {
      id: `createCommit ${res?.data?.versionMutations.create.id}`,
      modelCardId: args.modelCardId,
      text: 'Version Created',
      level: 'success',
      action: {
        name: 'View',
        url: `${defaultAccount.value?.accountInfo.serverInfo.url}/streams/${args.projectId}/commits/${res?.data?.versionMutations.create.id}`
      },
      visible: true
    }
    const model = documentModelStore.value.models.find(
      (m) => m.id === args.modelCardId
    ) as ISenderModelCard

    model.notifications?.push(notification)

    setTimeout(() => {
      const not = model.notifications?.find((n) => n.id === notification.id)
      const notifications = model.notifications?.filter((n) => n.id !== notification.id)
      notifications?.push({ ...not, visible: false } as ModelCardNotification)
      model.notifications = notifications
    }, 5000)
  })
  // First initialization calls
  void refreshDocumentInfo()
  void refreshDocumentModelStore()
  void refreshSendFilters()
  void getHostAppName()
  void getSendSettings()
  void getReceiveSettings()

  return {
    hostAppName,
    documentInfo,
    projectModelGroups,
    sendFilters,
    selectionFilter,
    everythingFilter,
    sendSettings,
    receiveSettings,
    addModel,
    highlightModel,
    updateModelFilter,
    updateModelSettings,
    removeModel,
    tryGetModel,
    sendModel,
    receiveModel,
    sendModelCancel,
    receiveModelCancel,
    invalidateReceiver,
    refreshSendFilters
  }
})
