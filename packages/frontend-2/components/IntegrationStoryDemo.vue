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
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const testDataQuery = graphql(`
  query TestData {
    testNumber
    testList {
      foo
      bar
    }
  }
`)

const { result } = useQuery(testDataQuery)
</script>
