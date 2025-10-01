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
  const supportedFileExtensions = ['rvt']

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

  type HubsResponse = {
    data: {
      id: string
      type: 'hubs'
      attributes: {
        name: string
        region: string
      }
    }[]
  }

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

  type ProjectsResponse = {
    data: {
      id: string
      type: 'projects'
      attributes: {
        name: string
      }
      relationships: {
        hub: {
          data: {
            id: string
            type: string
          }
        }
        rootFolder: {
          data: {
            id: string
          }
        }
      }
    }[]
  }


  /**
   * Fetches the immediate contents (folders and items) of a single folder.
   * This is a non-recursive, single-level fetch.
   */
  const fetchFolderContents = async (
    projectId: string,
    folderId: string,
    token: string
  ): Promise<AccItem[]> => {
    try {
      const res = await fetch(
        `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch contents of folder ${folderId}`)
      }
      const data = (await res.json()).data
      return data
    } catch (error) {
      logger.error(error, `Error fetching folder contents for ${folderId}:`)
      return []
    }
  }

  type FolderContentsResponse = {
    data: ({
      id: string
    }) & (
      | {
        type: 'folders'
        attributes: {
          name: string
          displayName: string
          objectCount: number
        }
      }
      | {
        type: 'items'
        attributes: {
          displayName: string
        }
      }
    )[]
  }

  /**
   * Fetches the latest version details for a specific item (file).
   * This function is separated for on-demand use.
   */
  const fetchItemLatestVersion = async (
    projectId: string,
    itemId: string,
    token: string
  ) => {
    try {
      const res = await fetch(
        `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}/tip`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch latest version for item ${itemId}`)
      }
      const data = (await res.json()).data
      return data
    } catch (error) {
      logger.error(error, `Error fetching latest version for item ${itemId}`)
      return null
    }
  }

  type ItemLatestVersionResponse = {
    data: {
      id: string
      type: 'versions'
      attributes: {
        name: string
        displayName: string
        versionNumber: number
        fileType: string
        createTime: Date
        createUserId: string
        createUserName: string
        lastModifiedTime: Date
        lastModifiedUserId: string
        lastModifiedUserName: string
      }
    }
  }

  // Application Logic

  /**
   * Builds the nested folder tree structure on initial project load.
   * This is a recursive function that only fetches folders, not files.
   * It now uses `attributes.objectCount` to avoid unnecessary API calls for empty folders.
   */
  const buildFolderTree = async (
    projectId: string,
    folderId: string,
    token: string
  ): Promise<AccFolder> => {
    const contents = await fetchFolderContents(projectId, folderId, token)
    const folders = contents.filter((item) => item.type === 'folders') as AccFolder[]

    const populatedFolders: AccFolder[] = []
    for (const folder of folders) {
      // We only want to add a folder to the tree if it contains something.
      // The `objectCount` attribute tells us if it's empty.
      if (folder.attributes.objectCount && folder.attributes.objectCount > 0) {
        // Recursively build the full subtree for this folder
        const subTree = await buildFolderTree(projectId, folder.id, token)
        populatedFolders.push({
          id: folder.id,
          type: folder.type,
          attributes: {
            name: folder.attributes.name || folder.attributes.displayName,
            displayName: folder.attributes.displayName
          },
          children: subTree.children
        })
      }
    }

    const folderTree = {
      id: folderId,
      type: 'folders',
      attributes: { name: 'Root Folder', displayName: 'Root Folder' },
      relationships: {},
      children: populatedFolders
    } as AccFolder

    return folderTree
  }

  /**
   * Fetches all items (files) for a specific folder when a user clicks on it.
   */
  const fetchItemsForFolder = async (
    folderId: string,
    projectId: string,
    token: string
  ) => {
    loadingItems.value = true
    folderItems.value = [] // Clear previous items

    const contents = await fetchFolderContents(projectId, folderId, token)
    const items = contents.filter((item) => item.type === 'items') as AccItem[] // items === files

    const itemPromises = items.map(async (item) => {
      const version = await fetchItemLatestVersion(projectId, item.id, token)
      if (version) {
        const storageUrn = version.relationships?.storage?.data?.id || null
        return {
          ...item,
          latestVersionId: version.id,
          fileExtension: version.attributes.fileType,
          storageUrn
        }
      }
      return item
    })

    folderItems.value = (await Promise.all(itemPromises)).filter((item) =>
      supportedFileExtensions.includes(item.fileExtension)
    )
    loadingItems.value = false
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
      const rootFolderId = await getProjectRootFolderId(hubId, projectId, token)
      if (rootFolderId) {
        folderTree.value = await buildFolderTree(projectId, rootFolderId, token)
      }
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
    fetchItemsForFolder,
    init
  }
}
