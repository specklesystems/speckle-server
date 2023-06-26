<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { Account } from '~/types/account'
import global from '~/types/globals'

useHead({
  // Title suffix
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} - Speckle DUIv3` : 'Speckle DUIv3',
  htmlAttrs: {
    lang: 'en'
  },
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  }
})

global.loadAccounts = loadAccounts
global.init = init

function init(callbackObjectKey: string, callbackFunctionKey: string) {
  console.log(callbackObjectKey, 'callback object key')
  console.log(callbackFunctionKey, 'callback function key')
}

function loadAccounts(accounts: Account[]) {
  localStorage.setItem('localAccounts', JSON.stringify(accounts))
  const uuid = localStorage.getItem('uuid')
  if (accounts.length !== 0) {
    let account: Account
    if (uuid) {
      account = accounts.find((acct: Account) => acct.userInfo.id === uuid)
    } else {
      account = accounts.find((acct: Account) => acct.isDefault)
    }
    if (account !== undefined) {
      localStorage.setItem('selectedAccount', JSON.stringify(account))
      localStorage.setItem('serverUrl', account.serverInfo.url)
      localStorage.setItem('SpeckleSketchup.AuthToken', account.token)
      localStorage.setItem('uuid', account.userInfo.id)
    }
  }
}

onMounted(() => {
  // TODO: this is the place somehow we need to figure out which host app we are running.
  if (window.sketchup !== undefined) {
    window.sketchup.exec({ name: 'init_local_accounts', data: {} })
  }
})
</script>
