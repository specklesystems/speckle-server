<template>
  <div>
    Active user test:
    <div>
      {{ activeUser ? activeUser.id : 'none' }}
    </div>
    <div>
      {{ data ? data.activeUser?.id : 'none' }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ApolloClient } from '@apollo/client/core'
import { activeUserQuery, useActiveUser } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

const { activeUser } = useActiveUser()

const { $apollo } = useNuxtApp()
const client = ($apollo as { default: ApolloClient<unknown> }).default

const { data } = await client
  .query({
    query: activeUserQuery
  })
  .catch(convertThrowIntoFetchResult)
</script>
