<template>
  <div>
    <div class="space-y-2">
      <div v-if="!loading">
        Hello world! You have
        {{ accounts.length }} accounts, out of which {{ validAccounts.length }} are
        valid.
      </div>
      <div v-else>Loading Accounts...</div>
      <div>
        <FormButton to="/test">Go To Test Bindings Page</FormButton>
      </div>
      <div v-for="acc in accounts" :key="acc.accountInfo.id">
        <div class="truncate text-xs">
          {{ acc.isValid }} // {{ acc.accountInfo.userInfo.email }} @
          <b>{{ acc.accountInfo.serverInfo.url }}</b>
          {{ acc.accountInfo.serverInfo.name }}
        </div>
      </div>
      <div>
        Your default account is at {{ defaultAccount?.accountInfo.serverInfo.url }}
      </div>
      <div>
        <div v-for="(res, clientId) in queries" :key="clientId">
          <strong>{{ clientId }}:</strong>
          {{ res.result.value?.serverInfo.version || res.error }}
        </div>
      </div>
      <div>Doc info:</div>
      <div>{{ documentInfo }}</div>
      <div>
        <FormButton @click="accountStore.refreshAccounts()">
          Refresh Accounts
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UseQueryReturn, useQuery } from '@vue/apollo-composable'
import { storeToRefs } from 'pinia'
import { graphql } from '~/lib/common/generated/gql'
import { ServerInfoTestQuery } from '~/lib/common/generated/gql/graphql'
import { useAccountStore } from '~/store/accounts'
import { useDocumentInfoStore } from '~/store/documentInfo'

const accountStore = useAccountStore()
const { accounts, defaultAccount, loading, validAccounts } = storeToRefs(accountStore)
const { documentInfo } = storeToRefs(useDocumentInfoStore())

const versionQuery = graphql(`
  query ServerInfoTest {
    serverInfo {
      version
    }
  }
`)

const clientIds = validAccounts.value.map((a) => a.accountInfo.id)

const queries: Record<
  string,
  UseQueryReturn<ServerInfoTestQuery, Record<string, never>>
> = {}

for (const clientId of clientIds) {
  queries[clientId] = useQuery(versionQuery, undefined, { clientId })
}
</script>
