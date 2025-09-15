import type { TreeNode, Viewer } from '@speckle/viewer'
import { defineStore } from 'pinia'
import type { ResourceInfo } from '../lib/urlHelper'

export type DataSource = {
  /** stored here for easy access to proxies, if any */
  rootObject: Record<string, unknown>
  /** a map <id, object> of all atomic objects */
  objectMap: Record<string, SpeckleObject>
  /** TODO */
  uniquePropertyKeys?: unknown
} & ResourceInfo

export type SpeckleObject = {
  id: string
} & Record<string, unknown>

export const useObjectDataStore = defineStore('objectDataStore', () => {
  const dataSourcesMap: Ref<Record<string, DataSource>> = ref({})

  const dataSources = computed(() => Object.values(dataSourcesMap.value))

  /**
   * For each passed in resource info, traverses the viewer's world tree and
   * creates an appropriate data source.
   * @param viewer
   * @param resources
   */
  async function populateDataStore(viewer: Viewer, resources: ResourceInfo[]) {
    const tree = viewer.getWorldTree()

    for (const res of resources) {
      const subnode = tree.findId(res.resourceUrl)![0]!
      const objectMap: Record<string, SpeckleObject> = {}

      await tree.walkAsync((node: TreeNode) => {
        if (node.model.atomic && node.model.raw.id) {
          objectMap[node.model.raw.id] = node.model.raw as SpeckleObject
        }
        return true
      }, subnode)

      dataSourcesMap.value[res.resourceUrl] = markRaw({
        ...res,
        rootObject: subnode.model.raw.children[0],
        objectMap
      })
    }
  }

  /**
   * Iterates through all the objects in the given resources without blocking
   * the ui, similar to the viewer's walkAsync.
   * @param resourceUrls
   * @param predicate
   */
  async function iterateAsync(
    resourceUrls: string[],
    predicate: (obj: SpeckleObject) => void
  ) {
    const dataSourceTargets: DataSource[] = resourceUrls.map(
      (url) => dataSourcesMap.value[url]!
    )
    const pause = new AsyncPause()

    for (const ds of dataSourceTargets) {
      for (const key in ds.objectMap) {
        pause.tick(100)

        if (pause.needsWait) {
          await pause.wait(16)
        }

        predicate(ds.objectMap[key]!)
      }
    }
  }

  return {
    populateDataStore,
    dataSourcesMap,
    iterateAsync,
    dataSources
  }
})
