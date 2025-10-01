import type {
  DataManagementFolderContentsFolder,
  DataManagementFolderContentsItem
} from '@/modules/acc/domain/acc/types'
import type {
  AccFolderGraphQLReturn,
  AccItemGraphQLReturn
} from '@/modules/acc/helpers/graphTypes'

export const filterContentsToFolders = (
  contents: (DataManagementFolderContentsFolder | DataManagementFolderContentsItem)[]
): DataManagementFolderContentsFolder[] => {
  return contents.filter(
    (entry): entry is DataManagementFolderContentsFolder => entry.type === 'folders'
  )
}

export const filterContentsToItems = (
  contents: (DataManagementFolderContentsFolder | DataManagementFolderContentsItem)[]
): DataManagementFolderContentsItem[] => {
  return contents.filter(
    (entry): entry is DataManagementFolderContentsItem => entry.type === 'items'
  )
}

export const mapFolderToGql = (
  folder: DataManagementFolderContentsFolder
): Omit<AccFolderGraphQLReturn, 'projectId'> => ({
  id: folder.id,
  name: folder.attributes.name ?? folder.attributes.displayName,
  objectCount: folder.attributes.objectCount
})

export const mapItemToGql = (
  item: DataManagementFolderContentsItem
): AccItemGraphQLReturn => ({
  id: item.id,
  name: item.attributes.name ?? item.attributes.displayName
})
