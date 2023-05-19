<template>
  <div>
    Hello world! Query results:
    <div>
      <div v-for="(res, clientId) in queries" :key="clientId">
        <strong>{{ clientId }}:</strong>
        {{ res.result.value?.serverInfo.version || '' }}
      </div>
    </div>
    <Portal to="navigation">
      <HeaderNavLink :to="'/'" :name="'Home'"></HeaderNavLink>
    </Portal>
  </div>
</template>
<script setup lang="ts">
import { UseQueryReturn, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { ServerInfoTestQuery } from '~/lib/common/generated/gql/graphql'

const versionQuery = graphql(`
  query ServerInfoTest {
    serverInfo {
      version
    }
  }
`)

/**
 * Imagine these come from window or something
 */
const clients = ['latest', 'xyz']

const queries: Record<
  string,
  UseQueryReturn<ServerInfoTestQuery, Record<string, never>>
> = {}
for (const clientId of clients) {
  queries[clientId] = useQuery(versionQuery, undefined, { clientId })
}
</script>
