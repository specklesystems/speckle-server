import { SpeckleViewer } from '@speckle/shared'

interface ReferencedObjectUrl {
  origin: string
  projectId: string
}

interface CommitReferencedObjectUrl {
  origin: string
  streamId: string
  commitId: string
}

export default class UrlHelper {
  static async getResourceUrls(url: string, authToken?: string): Promise<string[]> {
    /** I'm up for a better way of doing this */
    if (url.includes('streams')) return this.getOldResourceUrls(url, authToken)
    return this.getNewResourceUrls(url, authToken)
  }

  static async getOldResourceUrls(url: string, authToken?: string): Promise<string[]> {
    const parsed = new URL(url)
    const streamId = url.split('/streams/')[1].substring(0, 10)

    const objsUrls = []
    // supports commit based urls
    if (url.includes('commits')) {
      const commitId = url.split('/commits/')[1].substring(0, 10)
      const objUrl = await this.getCommitReferencedObjectUrl({
        origin: parsed.origin,
        streamId,
        commitId
      })
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
              await this.getCommitReferencedObjectUrl(
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

  private static async getCommitReferencedObjectUrl(
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

  static async getNewResourceUrls(url: string, authToken?: string): Promise<string[]> {
    const objsUrls: string[] | PromiseLike<string[]> = []
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

    for (let k = 0; k < resources.length; k++) {
      const resource: SpeckleViewer.ViewerRoute.ViewerResource = resources[k]

      if (SpeckleViewer.ViewerRoute.isObjectResource(resource)) {
        objsUrls.push(await this.objectResourceToUrl(ref, resource))
      } else if (SpeckleViewer.ViewerRoute.isModelResource(resource)) {
        objsUrls.push(await this.modelResourceToUrl(headers, ref, resource))
      } else if (SpeckleViewer.ViewerRoute.isAllModelsResource(resource)) {
        objsUrls.push(...(await this.modelAllResourceToUrl(headers, ref)))
      }
    }

    return objsUrls
  }

  private static async objectResourceToUrl(
    ref: ReferencedObjectUrl,
    resource: SpeckleViewer.ViewerRoute.ViewerObjectResource
  ): Promise<string> {
    return Promise.resolve(
      `${ref.origin}/streams/${ref.projectId}/objects/${resource.toString()}`
    )
  }

  private static async modelResourceToUrl(
    headers: {
      'Content-Type': string
      Authorization: string
    },
    ref: ReferencedObjectUrl,
    resource: SpeckleViewer.ViewerRoute.ViewerModelResource
  ): Promise<string> {
    return resource.versionId
      ? this.runModelVersionQuery(headers, ref, resource)
      : this.runModelLastVersionQuery(headers, ref, resource)
  }

  private static async modelAllResourceToUrl(
    headers: {
      'Content-Type': string
      Authorization: string
    },
    ref: ReferencedObjectUrl
  ): Promise<string[]> {
    return this.runAllModelsQuery(headers, ref)
  }

  private static async runModelLastVersionQuery(
    headers: { 'Content-Type': string; Authorization: string },
    ref: ReferencedObjectUrl,
    resource: SpeckleViewer.ViewerRoute.ViewerModelResource
  ): Promise<string> {
    const res = await fetch(`${ref.origin}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          query ExampleQuery($modelId: String!, $projectId: String!) {
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
    const { data } = await res.json()
    return `${ref.origin}/streams/${ref.projectId}/objects/${data.project.model.versions.items[0].referencedObject}`
  }

  private static async runModelVersionQuery(
    headers: { 'Content-Type': string; Authorization: string },
    ref: ReferencedObjectUrl,
    resource: SpeckleViewer.ViewerRoute.ViewerModelResource
  ): Promise<string> {
    const res = await fetch(`${ref.origin}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          query ExampleQuery($modelId: String!, $projectId: String!, $versionId: String!) {
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
    const { data } = await res.json()
    return `${ref.origin}/streams/${ref.projectId}/objects/${data.project.model.version.referencedObject}`
  }

  private static async runAllModelsQuery(
    headers: { 'Content-Type': string; Authorization: string },
    ref: ReferencedObjectUrl
  ): Promise<string[]> {
    const res = await fetch(`${ref.origin}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
         query Query($projectId: String!) {
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
    const { data } = await res.json()
    const urls: string[] = []
    data.project.models.items.forEach(
      (element: { versions: { items: { referencedObject: string }[] } }) => {
        urls.push(
          `${ref.origin}/streams/${ref.projectId}/objects/${element.versions.items[0].referencedObject}`
        )
      }
    )
    return urls
  }
}
