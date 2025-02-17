import gql from 'graphql-tag'

export const createProjectModelQuery = gql`
  mutation CreateProjectModel($input: CreateModelInput!) {
    modelMutations {
      create(input: $input) {
        id
        name
        description
      }
    }
  }
`

export const findProjectModelByNameQuery = gql`
  query FindProjectModelByName($projectId: String!, $name: String!) {
    project(id: $projectId) {
      modelByName(name: $name) {
        id
        name
        description
      }
    }
  }
`
