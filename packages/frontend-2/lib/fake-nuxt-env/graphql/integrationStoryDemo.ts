import { graphql } from '~~/lib/common/generated/gql'

export const fakeInternalQuery = graphql(`
  query InternalTestData {
    testNumber
    testList {
      foo
      bar
    }
  }
`)
