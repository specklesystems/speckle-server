import { SpeckleViewer } from '@speckle/shared'
import Logger from './utils/Logger.js'

interface ReferencedObjectUrl {
  origin: string
  projectId: string
}

interface CommitReferencedObjectUrl {
  origin: string
  streamId: string
  commitId: string
}

export async function getResourceUrls(
  url: string,
  authToken?: string
): Promise<string[]> {
  /** I'm up for a better way of doing this */
  if (url.includes('streams')) return getOldResourceUrls(url, authToken)
  return getNewResourceUrls(url, authToken)
}

async function getOldResourceUrls(url: string, authToken?: string): Promise<string[]> {
  const parsed = new URL(url)
  const streamId = url.split('/streams/')[1].substring(0, 10)

  const objsUrls = []
  // supports commit based urls
  if (url.includes('commits')) {
    const commitId = url.split('/commits/')[1].substring(0, 10)
    const objUrl = await getCommitReferencedObjectUrl(
      {
        origin: parsed.origin,
        streamId,
        commitId
      },
      authToken
    )
    objsUrls.push(objUrl)
  }

  // object based urls
  if (url.includes('objects')) objsUrls.push(url)

  // supports urls that include overlay queries
  // e.g., https://speckle.xyz/streams/a632e7a784/objects/457c45feffa6f954572e5e86fb6d4f25?overlay=cf8dc76247,f5adc1d991b3dceb4b5ad6b50f919a0e
  if (url.includes('overlay=')) {
    const searchParams = new URLSearchParams(parsed.search)
    const resIds = searchParams.get('overlay')?.split(',')
    if (resIds !== undefined) {
      for (const resId of resIds) {
        if (resId.length === 10) {
          objsUrls.push(
            await getCommitReferencedObjectUrl(
              {
                origin: parsed.origin,
                streamId,
                commitId: resId
              } as CommitReferencedObjectUrl,
              authToken
            )
          )
        } else {
          objsUrls.push(`${parsed.origin}/streams/${streamId}/objects/${resId}`)
        }
      }
    }
  }

  return objsUrls
}

async function getCommitReferencedObjectUrl(
  ref: CommitReferencedObjectUrl,
  authToken?: string
) {
  const headers: { 'Content-Type': string; Authorization: string } = {
    'Content-Type': 'application/json',
    Authorization: ''
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  const res = await fetch(`${ref.origin}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
          query Stream($streamId: String!, $commitId: String!) {
            stream(id: $streamId) {
              commit(id: $commitId) {
                referencedObject
              }
            }
          }
        `,
      variables: { streamId: ref.streamId, commitId: ref.commitId }
    })
  })

  const { data } = await res.json()
  return `${ref.origin}/streams/${ref.streamId}/objects/${data.stream.commit.referencedObject}`
}

async function getNewResourceUrls(url: string, authToken?: string): Promise<string[]> {
  const parsed = new URL(decodeURI(url))
  const params = parsed.href.match(/[^/]+$/)
  if (!params) {
    return Promise.reject('No model or object ids specified')
  }

  const projectId = parsed.href.split('/projects/')[1].substring(0, 10)
  const headers: { 'Content-Type': string; Authorization: string } = {
    'Content-Type': 'application/json',
    Authorization: ''
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const ref: ReferencedObjectUrl = {
    origin: parsed.origin,
    projectId
  }

  const resources = SpeckleViewer.ViewerRoute.parseUrlParameters(
    decodeURIComponent(params[0])
  )

  const promises = []
  for (let k = 0; k < resources.length; k++) {
    const resource: SpeckleViewer.ViewerRoute.ViewerResource = resources[k]

    if (SpeckleViewer.ViewerRoute.isObjectResource(resource)) {
      promises.push(objectResourceToUrl(ref, resource))
    } else if (SpeckleViewer.ViewerRoute.isModelResource(resource)) {
      promises.push(modelResourceToUrl(headers, ref, resource))
    } else if (SpeckleViewer.ViewerRoute.isAllModelsResource(resource)) {
      promises.push(modelAllResourceToUrl(headers, ref))
    }
  }

  return (await Promise.all(promises)).flat()
}

async function objectResourceToUrl(
  ref: ReferencedObjectUrl,
  resource: SpeckleViewer.ViewerRoute.ViewerObjectResource
): Promise<string> {
  return Promise.resolve(
    `${ref.origin}/streams/${ref.projectId}/objects/${resource.toString()}`
  )
}

async function modelResourceToUrl(
  headers: {
    'Content-Type': string
    Authorization: string
  },
  ref: ReferencedObjectUrl,
  resource: SpeckleViewer.ViewerRoute.ViewerModelResource
): Promise<string> {
  return resource.versionId
    ? runModelVersionQuery(headers, ref, resource)
    : runModelLastVersionQuery(headers, ref, resource)
}

async function modelAllResourceToUrl(
  headers: {
    'Content-Type': string
    Authorization: string
  },
  ref: ReferencedObjectUrl
): Promise<string[]> {
  return runAllModelsQuery(headers, ref)
}

async function runModelLastVersionQuery(
  headers: { 'Content-Type': string; Authorization: string },
  ref: ReferencedObjectUrl,
  resource: SpeckleViewer.ViewerRoute.ViewerModelResource
): Promise<string> {
  const res = await fetch(`${ref.origin}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
          query ViewerUrlHelperModelLastVersion($modelId: String!, $projectId: String!) {
            project(id: $projectId) {
              model(id: $modelId) {
                versions(limit: 1) {
                  items {
                    referencedObject
                  }
                }
              }
            }
          }
        `,
      variables: {
        projectId: ref.projectId,
        modelId: resource.modelId
      }
    })
  })
  try {
    const data = await getResponse(res)
    return `${ref.origin}/streams/${ref.projectId}/objects/${data.project.model.versions.items[0].referencedObject}`
  } catch (e) {
    Logger.error(
      `Could not get object URLs for project ${ref.projectId} and model ${
        resource.modelId
      }. Error: ${e instanceof Error ? e.message : e}`
    )
  }
  return ''
}

async function runModelVersionQuery(
  headers: { 'Content-Type': string; Authorization: string },
  ref: ReferencedObjectUrl,
  resource: SpeckleViewer.ViewerRoute.ViewerModelResource
): Promise<string> {
  const res = await fetch(`${ref.origin}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
          query ViewerUrlHelperModelVersion($modelId: String!, $projectId: String!, $versionId: String!) {
            project(id: $projectId) {
              model(id: $modelId) {
                version(id: $versionId) {
                  referencedObject
                }
              }
            }
          }
        `,
      variables: {
        projectId: ref.projectId,
        modelId: resource.modelId,
        versionId: resource.versionId
      }
    })
  })
  try {
    const data = await getResponse(res)
    return `${ref.origin}/streams/${ref.projectId}/objects/${data.project.model.version.referencedObject}`
  } catch (e) {
    Logger.error(
      `Could not get object URLs for project ${ref.projectId} and model ${
        resource.modelId
      }. Error: ${e instanceof Error ? e.message : e}`
    )
  }
  return ''
}

async function runAllModelsQuery(
  headers: { 'Content-Type': string; Authorization: string },
  ref: ReferencedObjectUrl
): Promise<string[]> {
  const res = await fetch(`${ref.origin}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
         query ViewerUrlHelperAllModel($projectId: String!) {
          project(id: $projectId) {
            models {
              items {
                versions(limit: 1) {
                  items {
                    referencedObject
                  }
                }
              }
            }
          }
        }
        `,
      variables: {
        projectId: ref.projectId
      }
    })
  })
  try {
    const data = await getResponse(res)
    const urls: string[] = []
    data.project.models.items.forEach(
      (element: { versions: { items: { referencedObject: string }[] } }) => {
        urls.push(
          `${ref.origin}/streams/${ref.projectId}/objects/${element.versions.items[0].referencedObject}`
        )
      }
    )
    return urls
  } catch (e) {
    Logger.error(
      `Could not get object URLs for project ${ref.projectId}. Error: ${
        e instanceof Error ? e.message : e
      }`
    )
  }
  return ['']
}

async function getResponse(res: Response) {
  const { data } = await res.json()
  if (!data) throw new Error(`Query failed`)

  if (!data.project) throw new Error('Project not found')

  if (!data.project.model && !data.project.models) throw new Error('Model(s) not found')

  return data
}
