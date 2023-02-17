import { graphql } from '~~/lib/common/generated/gql'

export const mentionsUserSearchQuery = graphql(`
  query MentionsUserSearch($query: String!) {
    userSearch(query: $query, limit: 5, cursor: null, archived: false) {
      items {
        id
        name
        company
      }
    }
  }
`)

export const serverInfoBlobSizeLimitQuery = graphql(`
  query ServerInfoBlobSizeLimit {
    serverInfo {
      blobSizeLimitBytes
    }
  }
`)
