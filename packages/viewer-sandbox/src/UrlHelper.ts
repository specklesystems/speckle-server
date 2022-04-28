interface CommitReferencedObjectUrl {
  origin: string
  streamId: string
  commitId: string
}

export default class UrlHelper {
  static async getResourceUrls(url: string): Promise<string[]> {
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
              await this.getCommitReferencedObjectUrl({
                origin: parsed.origin,
                streamId,
                commitId: resId
              } as CommitReferencedObjectUrl)
            )
          } else {
            objsUrls.push(`${parsed.origin}/streams/${streamId}/objects/${resId}`)
          }
        }
      }
    }

    return objsUrls
  }

  private static async getCommitReferencedObjectUrl(ref: CommitReferencedObjectUrl) {
    const res = await fetch(`${ref.origin}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    return `${origin}/streams/${ref.streamId}/objects/${data.stream.commit.referencedObject}`
  }
}
