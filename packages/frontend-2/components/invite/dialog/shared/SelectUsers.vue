<template>
  <form>
    <div class="flex flex-col gap-y-3 text-foreground mb-3">
      <div v-for="(item, index) in fields" :key="item.key" class="flex gap-x-3">
        <div class="flex flex-col gap-y-3 flex-1">
          <div class="flex flex-row gap-x-3">
            <div class="flex-1">
              <FormTextInput
                v-model="item.value.email"
                :name="`email-${item.key}`"
                color="foundation"
                placeholder="Email address"
                show-clear
                full-width
                use-label-in-errors
                :show-label="index === 0"
                label="Email"
                :rules="[
                  isEmailOrEmpty,
                  canHaveRole({
                    allowedDomains: props.allowedDomains,
                    workspaceRole: props.targetRole
                  })
                ]"
                :help="
                  item.value.matchesDomainPolicy === false
                    ? 'This email does not match the set domain policy, and can only be invited as a guest'
                    : undefined
                "
              />
            </div>
            <FormSelectWorkspaceRoles
              v-if="props.showWorkspaceRoles"
              v-model="item.value.workspaceRole"
              label="Select role"
              :name="`project-role-${item.key}`"
              class="sm:w-44"
              mount-menu-on-body
              :allow-unset="false"
              :show-label="index === 0"
              :disabled-items="getDisabledWorkspaceItems(item.value.email)"
              disabled-item-tooltip="This email does not match the set domain policy, and can only be invited as a guest"
            />
          </div>
        </div>
        <div class="relative w-4">
          <CommonTextLink
            v-if="fields.length > 1"
            class="absolute right-0"
            :class="{ 'top-7': index === 0 }"
            @click="removeInviteItem(index)"
          >
            <TrashIcon class="h-4 w-4 text-foreground-2" />
          </CommonTextLink>
        </div>
      </div>
      <FormButton color="subtle" :icon-left="PlusIcon" @click="addInviteItem">
        Add another user
      </FormButton>
    </div>
    <slot />
  </form>
</template>
<script setup lang="ts">
import { useForm, useFieldArray } from 'vee-validate'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type {
  InviteWorkspaceForm,
  InviteWorkspaceItem
} from '~~/lib/invites/helpers/types'
import { emptyInviteWorkspaceItem } from '~~/lib/invites/helpers/constants'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import { Roles, type WorkspaceRoles, type MaybeNullOrUndefined } from '@speckle/shared'
import { canHaveRole, matchesDomainPolicy } from '~/lib/invites/helpers/validation'

const props = defineProps<{
  invites: InviteWorkspaceItem[]
  allowedDomains: MaybeNullOrUndefined<string[]>
  showWorkspaceRoles?: boolean
  targetRole?: WorkspaceRoles
}>()

const { handleSubmit } = useForm<InviteWorkspaceForm>({
  initialValues: {
    fields: [...props.invites]
  }
})
const {
  fields,
  push: pushInvite,
  remove: removeInvite
} = useFieldArray<InviteWorkspaceItem>('fields')

const addInviteItem = () => {
  pushInvite({
    ...emptyInviteWorkspaceItem,
    workspaceRole: Roles.Workspace.Member,
    projectRole: Roles.Stream.Contributor
  })
}

const removeInviteItem = (index: number) => {
  removeInvite(index)
}

const getDisabledWorkspaceItems = (email: string): WorkspaceRoles[] => {
  return !matchesDomainPolicy(email, props.allowedDomains)
    ? [Roles.Workspace.Admin, Roles.Workspace.Member]
    : []
}

const submitForm = handleSubmit(() => {
  const invites = fields.value
    .filter((invite) => invite.value.email)
    .map((invite) => ({ ...invite.value }))

  return invites
})

defineExpose({
  submitForm
})
</script>
