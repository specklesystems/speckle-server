<template>
  <button
    v-tippy="tip"
    :class="`group block w-full p-1 text-left items-center space-x-2  select-none group transition hover:bg-primary-muted hover:cursor-pointer hover:text-primary ${
      !account.isValid
        ? 'text-danger bg-rose-500/10 cursor-not-allowed'
        : 'cursor-pointer'
    } ${
      currentSelectedAccountId === account.accountInfo.id
        ? 'bg-blue-500/5 text-primary'
        : ''
    }`"
    :disabled="!account.isValid"
    @click="$emit('select', account)"
  >
    <div class="flex items-center space-x-2">
      <UserAvatar
        :user="userAvatar"
        :active="account.accountInfo.isDefault"
        size="sm"
      />
      <div class="min-w-0 grow">
        <div class="truncate overflow-hidden min-w-0 flex items-center space-x-2">
          <span>{{ account.accountInfo.serverInfo.name }}</span>
          <span class="text-foreground-2 truncate min-w-0 caption">
            {{ account.accountInfo.serverInfo.url.split('//')[1] }}
          </span>
        </div>
      </div>
    </div>
  </button>
</template>
<script setup lang="ts">
import type { DUIAccount } from '~~/store/accounts'

const props = defineProps<{
  account: DUIAccount
  currentSelectedAccountId?: string
}>()

defineEmits<{
  (e: 'select', account: DUIAccount): void
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
</script>
