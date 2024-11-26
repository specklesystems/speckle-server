import { graphql } from '~~/lib/common/generated/gql'

// TODO: Clean up these operations and make them component fragment based. Also some of the props requested don't seem to even be used

export const activeUserGendoLimits = graphql(`
  query ActiveUserGendoLimits {
    activeUser {
      id
      gendoAICredits {
        used
        limit
        resetDate
      }
    }
  }
`)

export const requestGendoAIRender = graphql(`
  mutation requestGendoAIRender($input: GendoAIRenderInput!) {
    versionMutations {
      requestGendoAIRender(input: $input)
    }
  }
`)

/**
 * Get an individual gendo ai render
 */
export const getGendoAIRender = graphql(`
  query GendoAIRender(
    $gendoAiRenderId: String!
    $versionId: String!
    $projectId: String!
  ) {
    project(id: $projectId) {
      id
      version(id: $versionId) {
        id
        gendoAIRender(id: $gendoAiRenderId) {
          id
          projectId
          modelId
          versionId
          createdAt
          updatedAt
          gendoGenerationId
          status
          prompt
          camera
          responseImage
          user {
            name
            avatar
            id
          }
        }
      }
    }
  }
`)

/**
 * Get the version's list of gendo ai renders
 */
export const getGendoAIRenders = graphql(`
  query GendoAIRenders($versionId: String!, $projectId: String!) {
    project(id: $projectId) {
      id
      version(id: $versionId) {
        id
        gendoAIRenders {
          totalCount
          items {
            id
            createdAt
            updatedAt
            status
            gendoGenerationId
            prompt
            camera
          }
        }
      }
    }
  }
`)

export const onGendoAiRenderCreated = graphql(`
  subscription ProjectVersionGendoAIRenderCreated($id: String!, $versionId: String!) {
    projectVersionGendoAIRenderCreated(id: $id, versionId: $versionId) {
      id
      createdAt
      updatedAt
      status
      gendoGenerationId
      prompt
      camera
    }
  }
`)

export const onGendoAiRenderUpdated = graphql(`
  subscription ProjectVersionGendoAIRenderUpdated($id: String!, $versionId: String!) {
    projectVersionGendoAIRenderUpdated(id: $id, versionId: $versionId) {
      id
      projectId
      modelId
      versionId
      createdAt
      updatedAt
      gendoGenerationId
      status
      prompt
      camera
      responseImage
    }
  }
`)
