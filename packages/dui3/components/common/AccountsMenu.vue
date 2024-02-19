<template>
  <div>
    <button @click="showAccountsDialog = true">
      <UserAvatar :user="user" hover-effect />
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
import { useAccountStore, DUIAccount } from '~/store/accounts'

const showAccountsDialog = ref(false)

const accountStore = useAccountStore()
const { accounts, defaultAccount } = storeToRefs(accountStore)

const user = computed(() => {
  if (!defaultAccount.value) return undefined
  return {
    name: defaultAccount.value?.accountInfo.userInfo.name,
    avatar: defaultAccount.value?.accountInfo.userInfo.avatar
  }
})
</script>
