<template>
  <form>
    <slot name="project" />
    <div class="flex flex-col gap-y-3 text-foreground mb-3">
      <div v-for="(item, index) in fields" :key="item.key" class="flex gap-x-3">
        <div class="flex flex-col gap-y-3 flex-1">
          <div class="flex flex-row gap-x-3">
            <div class="flex-1 flex gap-2">
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
              <FormSelectWorkspaceSeatType
                v-model="item.value.seatType"
                :allow-unset="false"
                :name="`seatType-${item.key}`"
                :show-label="index === 0"
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
            <Trash2
              :size="LucideSize.base"
              :stroke-width="1.5"
              :absolute-stroke-width="true"
              class="text-foreground-2"
            />
          </CommonTextLink>
        </div>
      </div>
      <div>
        <FormButton color="subtle" :icon-left="Plus" @click="addInviteItem">
          Add another user
        </FormButton>
      </div>
    </div>
    <p class="text-body-2xs text-foreground-2 leading-5">
      {{ infoText }}
    </p>
  </form>
</template>
<script setup lang="ts">
import { useForm, useFieldArray } from 'vee-validate'
import { Plus, Trash2 } from 'lucide-vue-next'
import type {
  InviteWorkspaceForm,
  InviteWorkspaceItem
} from '~~/lib/invites/helpers/types'
import { emptyInviteWorkspaceItem } from '~~/lib/invites/helpers/constants'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import {
  Roles,
  type WorkspaceRoles,
  type MaybeNullOrUndefined,
  SeatTypes
} from '@speckle/shared'
import { canHaveRole } from '~/lib/invites/helpers/validation'
import { parsePastedEmails } from '~/lib/invites/helpers/helpers'
import { graphql } from '~/lib/common/generated/gql'
import type { InviteDialogSharedSelectUsers_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

graphql(`
  fragment InviteDialogSharedSelectUsers_Workspace on Workspace {
    id
    slug
    defaultSeatType
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<InviteDialogSharedSelectUsers_WorkspaceFragment>
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

const workspaceSlug = computed(() => props.workspace?.slug || '')
const { isPaidPlan, editorSeatPriceWithIntervalFormatted } =
  useWorkspacePlan(workspaceSlug)

const infoText = computed(() => {
  if (!isPaidPlan.value) return ''
  return `Viewer seats are free. You'll be charged ${editorSeatPriceWithIntervalFormatted.value} for each Editor seat when they accept. We'll use any unused Editor seats from your plan first.`
})

const addInviteItem = () => {
  pushInvite({
    ...emptyInviteWorkspaceItem,
    seatType: props.workspace?.defaultSeatType || SeatTypes.Viewer,
    workspaceRole: props.targetRole || Roles.Workspace.Guest,
    projectRole: Roles.Stream.Reviewer
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
            projectRole: Roles.Stream.Reviewer
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
