import { graphql } from '~~/lib/common/generated/gql'

export const createModelMutation = graphql(`
  mutation CreateModel($input: CreateModelInput!) {
    modelMutations {
      create(input: $input) {
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)

export const createProjectMutation = graphql(`
  mutation CreateProject($input: ProjectCreateInput) {
    projectMutations {
      create(input: $input) {
        ...ProjectPageProject
        ...ProjectDashboardItem
      }
    }
  }
`)
