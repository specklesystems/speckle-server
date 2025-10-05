import {
  encodeUrn,
  getApiUrl,
  invokeJsonRequest
} from '@/modules/acc/clients/autodesk/helpers'
import { getToken } from '@/modules/acc/clients/autodesk/tokens'
import type { AccRegion } from '@/modules/acc/domain/acc/constants'
import { AccRegions } from '@/modules/acc/domain/acc/constants'
import type {
  DataManagementFolderContentsFolder,
  DataManagementFolderContentsItem,
  DataManagementFolderContentsItemVersion,
  ModelDerivativeServiceDesignManifest
} from '@/modules/acc/domain/acc/types'
import { logger } from '@/observability/logging'

type AccWebhookConfig = {
  // The (unencoded) ACC folder urn to subscribe to. Event will fire for all files in this folder.
  rootProjectFolderUrn: string
  // The Speckle endpoint to hit when the given event fires.
  callbackUrl: string
  // The ACC webhook event to subscribe to. You can register an event to a given callback url only once.
  event: 'dm.version.added'
  // The region where the request is executed
  region: AccRegion
}

/**
 * Register relevant webhook callbacks for integration with a given ACC project.
 * @see https://aps.autodesk.com/en/docs/webhooks/v1/reference/http/webhooks/systems-system-events-event-hooks-POST/
 * @returns null if webhook already exists
 */
export const tryRegisterAccWebhook = async (
  webhook: AccWebhookConfig
): Promise<string | null> => {
  const { rootProjectFolderUrn, callbackUrl, event, region } = webhook

  const tokenData = await getToken()

  const response = await fetch(
    `https://developer.api.autodesk.com/webhooks/v1/systems/data/events/${event}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'x-ads-region': region
      },
      body: JSON.stringify({
        callbackUrl,
        scope: {
          folder: rootProjectFolderUrn
        }
      })
    }
  )

  if (response.ok && response.status === 201) {
    const webhookId = response.headers.get('Location')?.split('/').at(-1)

    if (!webhookId) {
      logger.info({ location: response.headers.get('Location') })
      throw new Error('Webhook created but failed to parse id')
    }

    return webhookId
  }

  const e = await response.json().catch(() => null)

  const isConflict =
    response.status === 409 &&
    e?.code === 'CONFLICT_ERROR' &&
    e?.detail?.includes('Failed to save duplicate webhooks scope')

  if (isConflict) {
    logger.warn('Webhook already exists. Skipping registration.')
    return null
  }

  throw new Error(`Webhook registration failed: ${JSON.stringify(e, null, 2)}`)
}

type GetFolderMetadataResponse = { data: DataManagementFolderContentsFolder }

/**
 * Get information about a given folder, like its name and object count
 * @see https://aps.autodesk.com/en/docs/data/v2/reference/http/projects-project_id-folders-folder_id-GET/
 */
export const getFolderMetadata = async (
  params: {
    projectId: string
    folderId: string
  },
  context: {
    token: string
    userId?: string
  }
): Promise<DataManagementFolderContentsFolder> => {
  const { projectId, folderId } = params
  const { token } = context

  const { data } = (await invokeJsonRequest({
    url: `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}`,
    method: 'GET',
    token
  })) as GetFolderMetadataResponse

  return data
}

type GetFolderContentsResponse = {
  data: (DataManagementFolderContentsFolder | DataManagementFolderContentsItem)[]
}

/**
 * Get the contents (subfolders and items) of a given ACC folder
 * @see https://aps.autodesk.com/en/docs/data/v2/reference/http/projects-project_id-folders-folder_id-contents-GET/
 */
export const getFolderContents = async (
  args: {
    projectId: string
    folderId: string
    type?: 'items' | 'folders'
  },
  context: {
    token: string
    userId?: string
  }
): Promise<
  (DataManagementFolderContentsFolder | DataManagementFolderContentsItem)[]
> => {
  const { projectId, folderId } = args
  const { token } = context

  const url = new URL(
    `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`
  )
  const params = new URLSearchParams()

  if (args.type) {
    params.append('filter[type]', args.type)
  }

  url.search = params.toString()

  const { data } = (await invokeJsonRequest({
    url: url.toString(),
    method: 'GET',
    token
  })) as GetFolderContentsResponse

  return data ?? []
}

type GetItemLatestVersionResponse = {
  data: DataManagementFolderContentsItemVersion
}

/**
 * Get item version information, like version number and file type, for the latest version of a given file
 * @see https://aps.autodesk.com/en/docs/data/v2/reference/http/projects-project_id-items-item_id-tip-GET/
 */
export const getItemLatestVersion = async (
  args: {
    projectId: string
    itemId: string
  },
  context: {
    token: string
    userId?: string
  }
): Promise<DataManagementFolderContentsItemVersion> => {
  const { projectId, itemId } = args
  const { token } = context

  const { data } = (await invokeJsonRequest({
    url: `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}/tip`,
    method: 'GET',
    token
  })) as GetItemLatestVersionResponse

  return data
}

/**
 * Get a manifest of the available derivative assets for a given design urn
 * @see https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/manifest/urn-manifest-GET/
 */
export const getManifestByUrn = async (
  params: {
    urn: string
    region: AccRegion
  },
  context: {
    token: string
  }
): Promise<ModelDerivativeServiceDesignManifest> => {
  const { urn, region = AccRegions.EMEA } = params
  const { token } = context

  const encodedUrn = encodeUrn(urn)

  const url = getApiUrl(`/designdata/${encodedUrn}/manifest`, region)

  return await invokeJsonRequest({
    url,
    token,
    method: 'GET'
  })
}
