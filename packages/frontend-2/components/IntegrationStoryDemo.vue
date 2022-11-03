<template>
  <div>
    Hello! Number: {{ result?.testNumber || 'loading...' }}
    <div v-if="result?.testList?.length">
      <ul>
        <li v-for="(item, i) in result.testList" :key="i">
          {{ `${item.foo}-${item.bar}` }}
        </li>
      </ul>
    </div>
    Also here's serverInfo loaded through storybook loaders:
    <div v-if="serverInfo">{{ JSON.stringify(serverInfo) }}</div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { PropType } from 'vue'
import { IntegrationStoryDemoServerInfoQuery } from '~~/lib/common/generated/gql/graphql'

const testDataQuery = graphql(`
  query TestData {
    testNumber
    testList {
      foo
      bar
    }
  }
`)

defineProps({
  serverInfo: {
    type: Object as PropType<IntegrationStoryDemoServerInfoQuery>,
    required: true
  }
})

const { result } = useQuery(testDataQuery)
</script>
