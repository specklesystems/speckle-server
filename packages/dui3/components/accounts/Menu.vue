<template>
  <div>
    <button v-tippy="`Click to change the account.`" @click="showAccountsDialog = true">
      <UserAvatar v-if="!showAccountsDialog" :user="user" hover-effect />
      <UserAvatar v-else hover-effect>
        <XMarkIcon class="w-6 h-6" />
      </UserAvatar>
    </button>
    <LayoutDialog
      v-model:open="showAccountsDialog"
      title="Select account"
      fullscreen="none"
    >
      <CommonLoadingBar :loading="isLoading" class="my-0" />
      <AccountsItem
        v-for="acc in accounts"
        :key="acc.accountInfo.id"
        :current-selected-account-id="currentSelectedAccountId"
        :account="(acc as DUIAccount)"
        class="rounded-lg mb-2"
        @select="selectAccount(acc as DUIAccount)"
      />
      <div class="mt-4">
        <div v-if="isDesktopServiceAvailable">
          <AccountsSignInFlow />
        </div>
        <div v-else class="flex flex-wrap justify-center space-x-4 max-width">
          <FormButton text @click="$openUrl(`speckle://accounts`)">
            Add account via Manager
          </FormButton>
          <FormButton text @click="accountStore.refreshAccounts()">
            Refresh accounts
          </FormButton>
        </div>
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useDesktopService } from '~/lib/core/composables/desktopService'

const { trackEvent } = useMixpanel()
const app = useNuxtApp()
const { $openUrl } = useNuxtApp()
const { pingDesktopService } = useDesktopService()

const props = defineProps<{
  currentSelectedAccountId?: string
}>()

defineEmits<{
  (e: 'select', account: DUIAccount): void
}>()

const showAccountsDialog = ref(false)
const isDesktopServiceAvailable = ref(false) // this should be false default because there is a delay if /ping is not successful.

app.$baseBinding.on('documentChanged', () => {
  showAccountsDialog.value = false
})

watch(showAccountsDialog, (newVal) => {
  if (newVal) {
    void accountStore.refreshAccounts()
    void trackEvent('DUI3 Action', { name: 'Account menu open' })
  }
})

const accountStore = useAccountStore()
const { accounts, defaultAccount, userSelectedAccount, isLoading } =
  storeToRefs(accountStore)

const selectAccount = (acc: DUIAccount) => {
  userSelectedAccount.value = acc
  accountStore.setUserSelectedAccount(acc) // saves the selected account id into DUI3Config.db for later use
  showAccountsDialog.value = false
  void trackEvent('DUI3 Action', { name: 'Account change' })
}

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

onMounted(async () => {
  isDesktopServiceAvailable.value = await pingDesktopService()
})
</script>
