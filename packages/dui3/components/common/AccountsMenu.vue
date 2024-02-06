<template>
  <div>
    <button @click="showAccountsDialog = true">
      <UserAvatar v-if="!open" :user="user" hover-effect />
      <UserAvatar v-else hover-effect>
        <XMarkIcon class="w-6 h-6" />
      </UserAvatar>
    </button>
    <LayoutDialog v-model:open="showAccountsDialog" hide-closer>
      <div class="-mx-6 -my-4">
        <HeaderUserAccount
          v-for="acc in accounts"
          :key="acc.accountInfo.id"
          :account="(acc as DUIAccount)"
          class="rounded-lg"
        />
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { useAccountStore, DUIAccount } from '~/store/accounts'
import { useConfigStore } from '~/store/config'

const showAccountsDialog = ref(false)

const accountStore = useAccountStore()
const { accounts, defaultAccount, isLoading } = storeToRefs(accountStore)

const user = computed(() => {
  if (!defaultAccount.value) return undefined
  return {
    name: defaultAccount.value?.accountInfo.userInfo.name,
    avatar: defaultAccount.value?.accountInfo.userInfo.avatar
  }
})
</script>
