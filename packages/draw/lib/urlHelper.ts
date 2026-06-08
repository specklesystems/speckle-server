import { SpeckleViewer } from '@speckle/shared'

interface ReferencedObjectUrl {
  origin: string
  projectId: string
}

export type ResourceInfo = {
  projectName: string
  projectId: string
  modelName: string
  modelId: string
  modelUpdatedAt: string
  rootObjectId: string
  versionId: string
  resourceUrl: string
}

export async function getResourcesFromUrl(
  url: string,
  authToken?: string
): Promise<ResourceInfo[]> {
  return getNewResourceUrls(url, authToken)
}

async function getNewResourceUrls(
  url: string,
  authToken?: string
): Promise<ResourceInfo[]> {
  const parsed = new URL(decodeURI(url))
  const params = parsed.href.match(/[^/]+$/)
  if (!params) {
    return Promise.reject(new Error('No model or object ids specified'))
  }

  const projectId = parsed.href.split('/projects/')[1]!.substring(0, 10)
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
    const resource: SpeckleViewer.ViewerRoute.ViewerResource = resources[k]!

    if (SpeckleViewer.ViewerRoute.isObjectResource(resource)) {
      promises.push(objectResourceToUrl(ref, resource))
    } else if (SpeckleViewer.ViewerRoute.isModelResource(resource)) {
      promises.push(modelResourceToUrl(headers, ref, resource))
    } else if (SpeckleViewer.ViewerRoute.isAllModelsResource(resource)) {
      promises.push(modelAllResourceToUrl(headers, ref))
    }
  }

  try {
    const results = await Promise.all(promises)
    return results.flatMap((val) => (Array.isArray(val) ? val : [val]))
  } catch (e) {
    console.error(e)
    return []
  }
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
): Promise<ResourceInfo> {
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
): Promise<ResourceInfo[]> {
  return runAllModelsQuery(headers, ref)
}

async function runModelLastVersionQuery(
  headers: { 'Content-Type': string; Authorization: string },
  ref: ReferencedObjectUrl,
  resource: SpeckleViewer.ViewerRoute.ViewerModelResource
): Promise<ResourceInfo> {
  const res = await fetch(`${ref.origin}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
          query ViewerUrlHelperModelLastVersion($modelId: String!, $projectId: String!) {
            project(id: $projectId) {
              id
              name
              model(id: $modelId) {
                id
                name
                updatedAt
                versions(limit: 1) {
                  items {
                    id
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
    const url = `${ref.origin}/streams/${ref.projectId}/objects/${data.project.model.versions.items[0].referencedObject}`
    const resourceInfo = {
      projectName: data.project.name,
      projectId: data.project.id,
      modelName: data.project.model.name,
      modelId: data.project.model.id,
      versionId: data.project.model.versions.items[0].id,
      rootObjectId: data.project.model.versions.items[0].referencedObject,
      modelUpdatedAt: data.project.model.updatedAt,
      resourceUrl: url
    }

    return resourceInfo
  } catch (e: unknown) {
    return Promise.reject(
      new Error(
        `Could not get object URLs for project ${ref.projectId} and model ${
          resource.modelId
        }. Error: ${e instanceof Error ? e.message : e}`
      )
    )
  }
}

async function runModelVersionQuery(
  headers: { 'Content-Type': string; Authorization: string },
  ref: ReferencedObjectUrl,
  resource: SpeckleViewer.ViewerRoute.ViewerModelResource
): Promise<ResourceInfo> {
  const res = await fetch(`${ref.origin}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
          query ViewerUrlHelperModelVersion($modelId: String!, $projectId: String!, $versionId: String!) {
            project(id: $projectId) {
              id
              name
              model(id: $modelId) {
                id
                name
                updatedAt
                version(id: $versionId) {
                  id
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
    const url = `${ref.origin}/streams/${ref.projectId}/objects/${data.project.model.version.referencedObject}`
    const resourceInfo = {
      projectName: data.project.name,
      projectId: data.project.id,
      modelName: data.project.model.name,
      modelId: data.project.model.id,
      modelUpdatedAt: data.project.model.updatedAt,
      rootObjectId: data.project.model.version.referencedObject,
      versionId: resource.versionId!,
      resourceUrl: url
    }

    return resourceInfo
  } catch (e) {
    return Promise.reject(
      new Error(
        `Could not get object URLs for project ${ref.projectId} and model ${
          resource.modelId
        }. Error: ${e instanceof Error ? e.message : e}`
      )
    )
  }
}

async function runAllModelsQuery(
  headers: { 'Content-Type': string; Authorization: string },
  ref: ReferencedObjectUrl
): Promise<ResourceInfo[]> {
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
        if (element.versions.items.length)
          urls.push(
            `${ref.origin}/streams/${ref.projectId}/objects/${
              element.versions.items[0]!.referencedObject
            }`
          )
      }
    )
    return urls
  } catch (e) {
    return Promise.reject(
      new Error(
        `Could not get object URLs for project ${ref.projectId}. Error: ${
          e instanceof Error ? e.message : e
        }`
      )
    )
  }
}

async function getResponse(res: Response) {
  const { data } = await res.json()
  if (!data) throw new Error(`Query failed`)

  if (!data.project) throw new Error('Project not found')

  if (!data.project.model && !data.project.models) throw new Error('Model(s) not found')

  return data
}
