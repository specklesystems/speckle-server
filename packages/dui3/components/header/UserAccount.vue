<template>
  <button
    v-tippy="tip"
    :class="`block w-full  text-left items-center space-x-2 hover:bg-primary-muted transition p-2 select-none group hover:cursor-pointer hover:text-primary ${
      !account.isValid ? 'text-danger bg-rose-500/10' : ''
    } ${account.accountInfo.isDefault ? 'bg-blue-500/5' : ''}`"
    @click="$openUrl(account.accountInfo.serverInfo.url)"
  >
    <div class="flex items-center space-x-2">
      <UserAvatar :user="userAvatar" :active="account.accountInfo.isDefault" />
      <div class="min-w-0 grow">
        <div class="truncate overflow-hidden min-w-0">
          {{ account.accountInfo.serverInfo.name }}
          <span class="text-foreground-2 truncate min-w-0">
            {{ account.accountInfo.serverInfo.url.split('//')[1] }}
          </span>
        </div>
        <div class="truncate text-xs text-foreground-2">
          {{ account.accountInfo.userInfo.email }}
        </div>
      </div>
      <div class="transition opacity-0 group-hover:opacity-100">
        <ArrowTopRightOnSquareIcon class="w-4 h-4" />
      </div>
    </div>
  </button>
</template>
<script setup lang="ts">
import type { DUIAccount } from 'lib/accounts/composables/setup'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{
  account: DUIAccount
}>()

const userAvatar = computed(() => {
  return {
    name: props.account.accountInfo.userInfo.name,
    avatar: props.account.accountInfo.userInfo.avatar
  }
})

const tip = computed(() => {
  let value = ''
  if (props.account.accountInfo.isDefault) value += 'This is your default account. '
  if (!props.account.isValid) value += 'This account is not reachable.'
  return value === '' ? null : value
})

const { $openUrl } = useNuxtApp()
</script>
