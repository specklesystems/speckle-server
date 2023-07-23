<template>
  <div class="flex items-center justify-center h-[calc(100vh-14rem)]">
    <div
      class="p-2 bg-primary text-foreground-on-primary shadow-md rounded-md font-bold"
    >
      <div>
        <FormButton @click="sketchupReceive()">Sketchup Receive</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import ObjectLoader from '@speckle/objectloader'
import { UseQueryReturn, useQuery } from '@vue/apollo-composable'
import { useInjectedAccounts } from '~/lib/accounts/composables/setup'
import { graphql } from '~/lib/common/generated/gql'
import { ServerInfoTestQuery } from '~/lib/common/generated/gql/graphql'
import { useInjectedDocumentInfo } from '~/lib/document-info'

const { accounts, refreshAccounts, defaultAccount } = useInjectedAccounts()

const { $baseBinding, $sketchupReceiveBinding } = useNuxtApp()
const appName = await $baseBinding.getSourceApplicationName()

const documentInfo = useInjectedDocumentInfo()

const versionQuery = graphql(`
  query ServerInfoTest {
    serverInfo {
      version
    }
  }
`)

async function sketchupReceive() {
  const objectId = '745ea505d154c09e2317121bd263a2b2'
  const streamId = '1ce562e99a'
  // Let sketchup know receive will start
  await $sketchupReceiveBinding.beforeReceive(streamId, objectId)

  const loader = new ObjectLoader({
    serverUrl: 'https://speckle.xyz',
    streamId,
    objectId
  })

  const t0 = Date.now()

  for await (const obj of loader.getObjectIterator()) {
    $sketchupReceiveBinding.receiveObject(streamId, objectId, obj)
  }

  const t1 = Date.now()
  const elapsedTime = (t1 - t0) / 1000
  console.log(`Receive time: ${elapsedTime} second`)

  await $sketchupReceiveBinding.afterReceive(streamId, objectId)
}

const clientIds = accounts.value.map((a) => a.accountInfo.id)

const queries: Record<
  string,
  UseQueryReturn<ServerInfoTestQuery, Record<string, never>>
> = {}

for (const clientId of clientIds) {
  queries[clientId] = useQuery(versionQuery, undefined, { clientId })
}
</script>
