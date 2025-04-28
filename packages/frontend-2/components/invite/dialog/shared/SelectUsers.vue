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
                    workspaceRole: targetRole
                  })
                ]"
                @paste="handlePaste($event, index)"
              />
            </div>
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
      <div>
        <div
          :key="`add-user-${fields.length}`"
          v-tippy="disableAddUserButton ? 'You can only invite 10 users at once' : ''"
          class="inline-block"
        >
          <FormButton
            color="subtle"
            :icon-left="PlusIcon"
            :disabled="disableAddUserButton"
            @click="addInviteItem"
          >
            Add another user
          </FormButton>
        </div>
      </div>
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
import { canHaveRole } from '~/lib/invites/helpers/validation'
import { parsePastedEmails } from '~/lib/invites/helpers/helpers'

const props = defineProps<{
  invites: InviteWorkspaceItem[]
  allowedDomains: MaybeNullOrUndefined<string[]>
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

const disableAddUserButton = computed(() => fields.value.length >= 200)

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

const handlePaste = (event: ClipboardEvent, index: number) => {
  const pastedText = event.clipboardData?.getData('text')

  if (pastedText && /[\s,;]/.test(pastedText)) {
    event.preventDefault()
    const validEmails = parsePastedEmails(pastedText)

    if (validEmails.length > 0) {
      fields.value[index].value.email = validEmails[0]
      validEmails.shift()

      if (validEmails.length > 0) {
        validEmails.forEach((email) => {
          pushInvite({
            ...emptyInviteWorkspaceItem,
            email,
            workspaceRole: Roles.Workspace.Member,
            projectRole: Roles.Stream.Contributor
          })
        })
      }
    }
  }
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
