<template>
  <LayoutDialog v-model:open="isOpen" :buttons="dialogButtons" max-width="md">
    <template #header>Invite to Project</template>
    <template v-if="isInWorkspace && invitableWorkspaceMembers.length">
      <InviteDialogProjectWorkspaceMembers :project="props.project" />
      <hr v-if="isAdmin" class="border-outline-3 mb-3 mt-5" />
    </template>
    <template v-if="isAdmin || !isInWorkspace">
      <form @submit="onSubmit">
        <div class="flex flex-col gap-y-3 text-foreground">
          <div v-for="(item, index) in fields" :key="item.key" class="flex flex-col">
            <div class="flex flex-1 gap-x-3">
              <div class="flex flex-col gap-y-3 flex-1">
                <div class="flex items-start gap-x-3">
                  <div class="flex-1">
                    <FormTextInput
                      v-model="item.value.email"
                      :name="`email-${item.key}`"
                      color="foundation"
                      placeholder="Email address"
                      show-clear
                      full-width
                      use-label-in-errors
                      show-label
                      label="Email"
                      :rules="[isEmailOrEmpty]"
                    />
                  </div>
                  <FormSelectProjectRoles
                    v-model="item.value.projectRole"
                    label="Select role"
                    :name="`fields.${index}.projectRole`"
                    class="w-40"
                    mount-menu-on-body
                    show-label
                    :allow-unset="false"
                    :hidden-items="[Roles.Stream.Owner]"
                  />
                </div>
                <div v-if="isInWorkspace">
                  <FormSelectProjects
                    v-model="item.value.project"
                    label="Select project"
                    class="w-full"
                    owned-only
                    show-optional
                    mount-menu-on-body
                    show-label
                    :name="`project-${index}`"
                    :disabled="!canBeMember(item.value.email)"
                    :tooltip-text="
                      canBeMember(item.value.email)
                        ? undefined
                        : 'This email does not match the set domain policy, and can only be invited to individual projects'
                    "
                  />
                </div>
              </div>
              <CommonTextLink class="mt-7">
                <TrashIcon
                  v-if="fields.length > 1"
                  class="h-4 w-4 text-foreground-2"
                  @click="removeInvite(index)"
                />
                <div v-else class="h-4 w-4"></div>
              </CommonTextLink>
            </div>
            <hr
              v-if="index !== fields.length - 1"
              class="flex-1 mt-3 border-outline-3"
            />
          </div>
          <FormButton color="subtle" :icon-left="PlusIcon" @click="addInviteItem">
            Add another user
          </FormButton>
        </div>
      </form>
      <div
        v-if="showBillingInfo"
        class="text-body-2xs text-foreground-2 leading-5 mt-4"
      >
        <p>
          Inviting users may add seats to your current billing cycle. Your workspace is
          currently billed for
          {{ memberSeatText }}{{ hasGuestSeats ? ` and ${guestSeatText}` : '' }}.
        </p>
      </div>
    </template>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import { useForm, useFieldArray } from 'vee-validate'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { InviteProjectForm, InviteProjectItem } from '~~/lib/invites/helpers/types'
import { emptyInviteProjectItem } from '~~/lib/invites/helpers/constants'
import { isEmailOrEmpty } from '~~/lib/common/helpers/validation'
import { Roles } from '@speckle/shared'
import { matchesDomainPolicy } from '~/lib/invites/helpers/validation'
import {
  type InviteDialogProject_ProjectFragment,
  type WorkspacePlans,
  type ProjectInviteCreateInput,
  type WorkspaceProjectInviteCreateInput,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import { useTeamInternals } from '~~/lib/projects/composables/team'
import { isPaidPlan } from '~/lib/billing/helpers/types'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~~/lib/core/composables/mp'

graphql(`
  fragment InviteDialogProject_Project on Project {
    id
    name
    ...InviteDialogProjectWorkspaceMembers_Project
    workspace {
      id
      name
      defaultProjectRole
      role
      domainBasedMembershipProtectionEnabled
      domains {
        domain
        id
      }
      plan {
        status
        name
      }
      subscription {
        seats {
          guest
          plan
        }
      }
    }
  }
`)

const props = defineProps<{
  project: InviteDialogProject_ProjectFragment
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const createInvite = useInviteUserToProject()
const { collaboratorListItems } = useTeamInternals(computed(() => props.project))
const { handleSubmit } = useForm<InviteProjectForm>({
  initialValues: {
    fields: [
      {
        ...emptyInviteProjectItem,
        projectRole: Roles.Stream.Contributor
      }
    ]
  }
})
const {
  fields,
  replace: replaceFields,
  push: pushInvite,
  remove: removeInvite
} = useFieldArray<InviteProjectItem>('fields')

const invitableWorkspaceMembers = computed(() => {
  const currentProjectMemberIds = new Set(
    collaboratorListItems.value.map((item) => item.user?.id)
  )

  return (
    props.project?.workspace?.team?.items.filter(
      (member) => member.user.id && !currentProjectMemberIds.has(member.user.id)
    ) || []
  )
})
const isInWorkspace = computed(() => !!props.project.workspace?.id)
const allowedDomains = computed(() =>
  props.project.workspace?.domains?.map((d) => d.domain)
)
const memberSeatText = computed(() =>
  props.project.workspace?.subscription?.seats.plan
    ? getSeatText(props.project.workspace.subscription.seats.plan, 'member')
    : ''
)
const guestSeatText = computed(() =>
  props.project.workspace?.subscription?.seats.guest
    ? getSeatText(props.project.workspace.subscription.seats.guest, 'guest')
    : ''
)
const hasGuestSeats = computed(
  () => (props.project.workspace?.subscription?.seats.guest ?? 0) > 0
)
const showBillingInfo = computed(() => {
  if (!props.project.workspace?.plan) return false
  return (
    isPaidPlan(props.project.workspace.plan.name as unknown as WorkspacePlans) &&
    props.project.workspace.plan.status === WorkspacePlanStatuses.Valid
  )
})
const isAdmin = computed(() => props.project.workspace?.role === Roles.Workspace.Admin)
const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Invite',
    props: {
      submit: true
    },
    onClick: onSubmit
  }
])

const getSeatText = (count: number, type: 'member' | 'guest') =>
  `${count} ${type} ${count === 1 ? 'seat' : 'seats'}`

const canBeMember = (email: string) => matchesDomainPolicy(email, allowedDomains.value)

const addInviteItem = () => {
  pushInvite({
    ...emptyInviteProjectItem,
    project: { id: props.project.id, name: props.project.name }
  })
}

const onSubmit = handleSubmit(async () => {
  const invites = fields.value
    .filter((invite) => invite.value.email)
    .map((invite) => invite.value)

  const inputs: ProjectInviteCreateInput[] | WorkspaceProjectInviteCreateInput[] =
    invites.map((u) => ({
      role: u.projectRole,
      email: u.email,
      serverRole: u.serverRole,
      ...(props.project?.workspace?.id
        ? {
            workspaceRole: u.project?.id
              ? Roles.Workspace.Member
              : Roles.Workspace.Guest
          }
        : {})
    }))
  if (!inputs.length) return

  await createInvite(props.project.id, inputs)

  mixpanel.track('Invite Action', {
    type: 'project invite',
    name: 'send',
    multiple: inputs.length !== 1,
    count: inputs.length,
    hasProject: true
  })

  isOpen.value = false
})

watch(isOpen, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    replaceFields([
      {
        ...emptyInviteProjectItem,
        project: { id: props.project.id, name: props.project.name }
      }
    ])
  }
})
</script>
