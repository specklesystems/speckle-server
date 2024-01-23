<template>
  <div>
    <button v-tippy="`Click to change the account.`" @click="showAccountsDialog = true">
      <UserAvatar v-if="!showAccountsDialog" :user="user" hover-effect />
      <UserAvatar v-else hover-effect>
        <XMarkIcon class="w-6 h-6" />
      </UserAvatar>
    </button>
    <LayoutDialog v-model:open="showAccountsDialog" hide-closer>
      <div class="-mx-6 -my-5">
        <AccountsItem
          v-for="acc in accounts"
          :key="acc.accountInfo.id"
          :current-selected-account-id="currentSelectedAccountId"
          :account="(acc as DUIAccount)"
          class="rounded-lg"
          @select="
            (e) => {
              $emit('select', e)
              showAccountsDialog = false
            }
          "
        />
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { useAccountStore, DUIAccount } from '~/store/accounts'

const props = defineProps<{
  currentSelectedAccountId?: string
}>()

defineEmits<{
  (e: 'select', account: DUIAccount): void
}>()

const showAccountsDialog = ref(false)

const accountStore = useAccountStore()
const { accounts, defaultAccount } = storeToRefs(accountStore)

const user = computed(() => {
  if (!defaultAccount.value) return undefined
  let acc = defaultAccount.value
  if (props.currentSelectedAccountId) {
    acc = accounts.value.find(
      (acc) => acc.accountInfo.id === props.currentSelectedAccountId
    ) as DUIAccount
  }
  return {
    name: acc.accountInfo.userInfo.name,
    avatar: acc.accountInfo.userInfo.avatar
  }
})
</script>
