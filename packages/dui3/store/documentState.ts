import {
  DocumentState,
  ModelCard
} from 'lib/bindings/definitions/IBasicConnectorBinding'

export type ProjectModelGroup = {
  projectId: string
  accountId: string
  models: ModelCard[]
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

  const addModel = async (model: ModelCard) => {
    await $baseBinding.addModelToDocumentState(model)
    documentState.value.models.push(model)
  }

  const removeModel = async (model: ModelCard) => {
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
