<template>
  <!-- <Popover class="relative">
    <PopoverButton v-slot="{ open }" class="">
      <UserAvatar v-if="!open" :user="user" hover-effect />
      <UserAvatar v-else hover-effect>
        <XMarkIcon class="w-6 h-6" />
      </UserAvatar>
    </PopoverButton>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel
        class="absolute translate -translate-x-full -mr-6 z-10 mt-5 flex w-screen max-w-screen"
      >
        <div class="rounded-xl bg-foundation p-2">
          <HeaderUserAccount
            v-for="acc in accounts"
            :key="acc.accountInfo.id"
            :account="(acc as DUIAccount)"
            class="rounded-lg"
          />
        </div>
      </PopoverPanel>
    </Transition>
  </Popover> -->
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
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/vue/20/solid'
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
