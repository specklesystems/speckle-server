<template>
  <div class="flex space-x-2 px-3 py-2">
    <UserAvatar v-if="invite.invitedBy" :user="invite.invitedBy" size="base" />
    <div class="flex space-y-2 flex-col">
      <div class="text-foreground text-body-xs leading-5">
        <slot name="message" />
      </div>
      <div class="flex space-x-2">
        <FormButton
          size="sm"
          color="outline"
          class="px-4"
          :disabled="loading"
          @click="onAcceptClick(token)"
        >
          {{ acceptMessage }}
        </FormButton>
        <FormButton
          size="sm"
          color="subtle"
          text
          :disabled="loading"
          @click="onDeclineClick(token)"
        >
          {{ declineMessage }}
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import type { AvatarUserType } from '~/lib/user/composables/avatar'

const emit = defineEmits<{
  processed: [accept: boolean, token: Optional<string>]
}>()

type GenericInviteItem = {
  invitedBy?: AvatarUserType
  user?: MaybeNullOrUndefined<{
    id: string
  }>
  token?: MaybeNullOrUndefined<string>
}

const props = defineProps<{
  invite: GenericInviteItem
  loading?: boolean
  isWorkspaceInvite?: boolean
}>()

const route = useRoute()

const token = computed(
  () => props.invite?.token || (route.query.token as Optional<string>)
)

const acceptMessage = computed(() =>
  props.isWorkspaceInvite ? 'Join workspace' : 'Join project'
)
const declineMessage = computed(() => (props.isWorkspaceInvite ? 'Dismiss' : 'Decline'))

const onDeclineClick = (token?: string) => {
  emit('processed', false, token)
}

const onAcceptClick = (token?: string) => {
  emit('processed', true, token)
}
</script>
