import {
  type Viewer,
  type PropertyInfo,
  type WorldTree,
  SpeckleLoader,
  CameraController
} from '@speckle/viewer'
import { defineStore } from 'pinia'
import { Vector3 } from 'three'
import type { Raw } from 'vue'
import { getToken } from '../lib/authn/useAuthManager'
import { getResourcesFromUrl } from '../lib/urlHelper'
import { useObjectDataStore } from '../stores/objectDataStore'

export const useViewerStore = defineStore('sharedViewer', () => {
  const isLoading = ref(false)
  const viewers = markRaw(new Map<string, Viewer>()) // Non-reactive
  const loadedViewerId = ref<string>()
  const dataStore = useObjectDataStore()

  const registerViewer = (id: string, viewer: Viewer) => {
    viewers.set(id, markRaw(viewer))
  }

  const unregisterViewer = (id: string) => {
    viewers.delete(id)
  }

  const getViewer = (id: string) => {
    return viewers.get(id)
  }

  async function loadModelByUrl(id: string, url: string) {
    isLoading.value = true
    try {
      const viewer = getViewer(id)
      if (!viewer) return
      const token = getToken()
      const resources = await getResourcesFromUrl(url, token)

      for (const r of resources) {
        const loader = new SpeckleLoader(viewer.getWorldTree(), r.resourceUrl, token)
        await viewer.loadObject(loader, true)
      }

      await dataStore.populateDataStore(viewer, resources)

      isLoading.value = false
      storeWorldTree(id, viewer.getWorldTree())
      loadedViewerId.value = id
    } catch (error) {
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const setCameraForPaper = (paperId: string) => {
    const canvasStore = useCanvasStore()
    const paper = canvasStore.getPaper(paperId)
    const viewer = getViewer(paperId)
    if (paper && paper.modelUrl && viewer) {
      const activeSnapshot = canvasStore.getActiveSnapshot(paper.id)
      if (activeSnapshot && activeSnapshot.viewer && activeSnapshot.viewer.camera) {
        const position = new Vector3(
          activeSnapshot.viewer?.camera?.position.x,
          activeSnapshot.viewer?.camera?.position.y,
          activeSnapshot.viewer?.camera?.position.z
        )
        const target = new Vector3(
          activeSnapshot.viewer?.camera?.target.x,
          activeSnapshot.viewer?.camera?.target.y,
          activeSnapshot.viewer?.camera?.target.z
        )
        viewer.getExtension(CameraController).setCameraView({ position, target }, true)
      }
    }
  }

  const selectedObjectsMap = ref<Record<string, unknown[]>>({})

  const selectedObjects = computed(() => {
    let allObjs = [] as unknown[]
    for (const key in selectedObjectsMap.value) {
      allObjs = [...allObjs, ...selectedObjectsMap.value[key]]
    }
    return allObjs
  })

  function setSelectedObjects(drawId: string, objects: unknown[]) {
    selectedObjectsMap.value[drawId] = objects
  }

  const objectPropertiesMap = ref<Record<string, Raw<PropertyInfo[]>>>({})

  function setObjectProperties(drawId: string, properties: PropertyInfo[]) {
    objectPropertiesMap.value[drawId] = markRaw(properties)
  }

  const worldTreeMap = ref<Record<string, WorldTree>>({})
  function storeWorldTree(drawId: string, tree: WorldTree) {
    worldTreeMap.value[drawId] = markRaw(tree)
  }

  function removeViewerModelData(drawId: string) {
    delete selectedObjectsMap.value[drawId]
    delete worldTreeMap.value[drawId]
    delete objectPropertiesMap.value[drawId]
  }

  return {
    getViewer,
    registerViewer,
    unregisterViewer,
    loadModelByUrl,
    setCameraForPaper,
    isLoading,
    loadedViewerId,
    setSelectedObjects,
    removeViewerModelData,
    selectedObjects,
    setObjectProperties,
    objectPropertiesMap,
    worldTreeMap,
    storeWorldTree
  }
})
