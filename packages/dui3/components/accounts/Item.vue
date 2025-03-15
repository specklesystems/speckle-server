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
      <button
        class="flex hidden group-hover:block px-2 py-1 text-danger"
        @click.stop="showRemoveAccountDialog = true"
      >
        <TrashIcon class="w-4 h-4" />
      </button>
    </div>
  </button>
  <CommonDialog v-model:open="showRemoveAccountDialog" fullscreen="none">
    <template #header>Remove Account</template>
    <div class="text-xs mb-4">
      Removing the account will remove the related model cards from your file. Do you
      want to remove the account?
    </div>
    <div class="flex justify-between center py-2 space-x-3">
      <FormButton
        size="sm"
        color="outline"
        full-width
        @click="showRemoveAccountDialog = false"
      >
        No
      </FormButton>
      <FormButton size="sm" full-width @click="handleRemove(account)">
        Remove
      </FormButton>
    </div>
  </CommonDialog>
</template>
<script setup lang="ts">
import type { DUIAccount } from '~~/store/accounts'
import { TrashIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  account: DUIAccount
  currentSelectedAccountId?: string
}>()

const emit = defineEmits<{
  (e: 'select', account: DUIAccount): void
  (e: 'remove', account: DUIAccount): void
}>()

const showRemoveAccountDialog = ref(false)

const handleRemove = (account: DUIAccount) => {
  emit('remove', account)
}

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
