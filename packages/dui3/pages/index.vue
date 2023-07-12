<template>
  <div>
    <Portal to="navigation">
      <div class="mx-2 py-1 px-2 rounded text-xs bg-primary text-white font-bold">
        for {{ appName }}
      </div>
      <!-- <HeaderNavLink :to="'/'" :name="'Home'"></HeaderNavLink> -->
    </Portal>
    <div class="space-y-2">
      <div>
        Hello world! You have
        {{ accounts.length }} accounts.
      </div>
      <div v-for="acc in accounts" :key="acc.accountInfo.id">
        <div class="truncate text-xs">
          {{ acc.accountInfo.userInfo.email }} @
          <b>{{ acc.accountInfo.serverInfo.url }}</b>
          {{ acc.accountInfo.serverInfo.name }}
        </div>
      </div>
      <div>Your default account is {{ defaultAccount?.accountInfo }}</div>
      <div>
        <div v-for="(res, clientId) in queries" :key="clientId">
          <strong>{{ clientId }}:</strong>
          {{ res.result.value?.serverInfo.version || res.error }}
        </div>
      </div>
      <div>
        <FormButton @click="refreshAccounts()">Refresh Accounts</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UseQueryReturn, useQuery } from '@vue/apollo-composable'
import { useAccountsSetup } from '~/lib/accounts/composables/setup'
import { graphql } from '~/lib/common/generated/gql'
import { ServerInfoTestQuery } from '~/lib/common/generated/gql/graphql'

const { $bindings } = useNuxtApp()
const appName = await $bindings.getSourceApplicationName()
const { accounts, refreshAccounts, defaultAccount } = await useAccountsSetup()

const versionQuery = graphql(`
  query ServerInfoTest {
    serverInfo {
      version
    }
  }
`)

watch(accounts, () => {
  console.log('accounts were refreshed, shallow ref does its job')
})

const clientIds = accounts.value.map((a) => a.accountInfo.id)

const queries: Record<
  string,
  UseQueryReturn<ServerInfoTestQuery, Record<string, never>>
> = {}

for (const clientId of clientIds) {
  queries[clientId] = useQuery(versionQuery, undefined, { clientId })
}
</script>
