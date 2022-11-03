<template>
  <div>
    Results of the internal query: {{ result?.testNumber || 'loading...' }}
    <br />
    <br />
    testList:
    <div v-if="result?.testList?.length">
      <ul>
        <li v-for="(item, i) in result.testList" :key="i">
          {{ `${item.foo}-${item.bar}` }}
        </li>
      </ul>
    </div>
    <br />
    <br />
    Also here's serverInfo loaded through props:
    <pre>
      <div v-if="serverInfo">{{ JSON.stringify(serverInfo, null, 2) }}</div>
    </pre>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { PropType } from 'vue'
import { IntegrationStoryDemoServerInfoQueryFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { fakeInternalQuery } from '~~/lib/fake-nuxt-env/graphql/integrationStoryDemo'

// Example of external query data being passed in through a fragment
graphql(`
  fragment IntegrationStoryDemoServerInfoQueryFragment on ServerInfo {
    blobSizeLimitBytes
    name
    company
    description
    adminContact
    canonicalUrl
    termsOfService
    inviteOnly
    version
  }
`)

// Example of internal query

defineProps({
  serverInfo: {
    type: Object as PropType<IntegrationStoryDemoServerInfoQueryFragmentFragment>,
    required: true
  }
})

// Example of internal query
const { result } = useQuery(fakeInternalQuery)
</script>
