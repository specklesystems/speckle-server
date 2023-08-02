import {
  DocumentState,
  IModelCard,
  ISendFilter
} from 'lib/bindings/definitions/IBasicConnectorBinding'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  models: IModelCard[]
}

export const useDocumentStateStore = defineStore('documentStateStore', () => {
  const { $baseBinding } = useNuxtApp()
  const documentState = ref<DocumentState>({ models: [] })

  const models = computed(() => documentState.value.models)

  const projectModelGroups = computed(() => {
    const projectModelGroups = [] as ProjectModelGroup[]

    for (const model of documentState.value.models) {
      let project = projectModelGroups.find((p) => p.projectId === model.projectId)
      if (!project) {
        project = { projectId: model.projectId, accountId: model.accountId, models: [] }
        projectModelGroups.push(project)
      }
      project.models.push(model)
    }

    return projectModelGroups
  })

  const addModel = async (model: IModelCard) => {
    await $baseBinding.addModelToDocumentState(model)
    documentState.value.models.push(model)
  }

  const updateModel = async () => {
    // TODO
  }

  const updateModelFilter = async (modelId: string, filter: ISendFilter) => {
    const model = documentState.value.models.find((m) => m.id === modelId)
  }

  const removeModel = async (model: IModelCard) => {
    await $baseBinding.removeModelFromDocumentState(model)
    const index = documentState.value.models.findIndex((m) => m.id === model.id)
    documentState.value.models.splice(index, 1)
  }

  const init = async () => {
    const docState = await $baseBinding.getDocumentState()
    documentState.value = docState
  }

  void init()

  return { addModel, removeModel, documentState, models, projectModelGroups }
})
