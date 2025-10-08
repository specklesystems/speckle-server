import type { AccHub, AccProject } from '@speckle/shared/acc'
import { ref } from 'vue'

// Placeholder types for demonstration. You should use your actual types.
export interface AccItem {
  id: string
  type: string
  attributes: {
    name: string
    displayName: string
    fileType?: string
    objectCount?: number
  }
  latestVersionId?: string
  fileExtension?: string
  storageUrn?: string | null
}

export interface AccFolder extends AccItem {
  children?: AccFolder[]
}

export type AccItemVersion = {
  id: string
  name: string
  fileType?: string
  versionNumber: number
}

/**
 * A composable function to handle ACC data fetching and state management.
 * The project details are passed to the `init` function and exptects to refresh all state when user selected new project.
 */
export function useAcc() {
  const loadingTree = ref<boolean>(false)
  const loadingItems = ref<boolean>(false)
  const loadingHubs = ref<boolean>(false)
  const loadingProjects = ref<boolean>(false)

  const folderTree = ref<AccFolder | undefined>()
  const folderItems = ref<AccItem[]>([])
  const hubs = ref<AccHub[]>([])
  const projects = ref<AccProject[]>([])

  const rootProjectFolderId = ref<string | undefined>()

  const logger = useLogger()

  // ACC API Functions

  /**
   * Fetches all hubs for the authenticated user.
   */
  const fetchHubs = async (token: string) => {
    loadingHubs.value = true
    try {
      const res = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch hubs')
      hubs.value = (await res.json()).data
    } catch (error) {
      logger.error(error, 'Error fetching ACC hubs')
      hubs.value = []
    } finally {
      loadingHubs.value = false
    }
  }

  // type HubsResponse = {
  //   data: {
  //     id: string
  //     type: 'hubs'
  //     attributes: {
  //       name: string
  //       region: string
  //     }
  //   }[]
  // }

  /**
   * Fetches all projects for a given hub.
   */
  const fetchProjects = async (hubId: string, token: string) => {
    loadingProjects.value = true
    try {
      const res = await fetch(
        `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch projects')
      projects.value = (await res.json()).data
    } catch (error) {
      logger.error(error, 'Error fetching ACC projects')
      projects.value = []
    } finally {
      loadingProjects.value = false
    }
  }

  // type ProjectsResponse = {
  //   data: {
  //     id: string
  //     type: 'projects'
  //     attributes: {
  //       name: string
  //     }
  //     relationships: {
  //       hub: {
  //         data: {
  //           id: string
  //           type: string
  //         }
  //       }
  //       rootFolder: {
  //         data: {
  //           id: string
  //         }
  //       }
  //     }
  //   }[]
  // }

  /**
   * Fetches the root folder ID for the project.
   */
  const getProjectRootFolderId = async (
    hubId: string,
    projectId: string,
    token: string
  ): Promise<string | undefined> => {
    try {
      const res = await fetch(
        `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed to get project details')

      const r = await res.json()
      rootProjectFolderId.value = r.data.relationships?.rootFolder?.data?.id || null
      return rootProjectFolderId.value
    } catch (error) {
      logger.error(error, `Error getting root folder ID for project: ${projectId}`)
      return undefined
    }
  }

  /**
   * Main entry point to initialize the folder tree for the selected project.
   */
  const init = async (hubId: string, projectId: string, token: string) => {
    loadingTree.value = true
    folderItems.value = []
    folderTree.value = undefined
    rootProjectFolderId.value = undefined
    try {
      await getProjectRootFolderId(hubId, projectId, token)
    } catch (error) {
      logger.error(error, 'Failed to initialize Autodesk ACC composable')
    } finally {
      loadingTree.value = false
    }
  }

  return {
    loadingTree,
    loadingItems,
    loadingHubs,
    loadingProjects,
    folderTree,
    folderItems,
    hubs,
    projects,
    rootProjectFolderId,
    fetchHubs,
    fetchProjects,
    init
  }
}
