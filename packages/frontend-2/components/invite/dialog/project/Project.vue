<template>
  <div>
    <LayoutDialog
      v-model:open="isOpen"
      prevent-close-on-click-outside
      :buttons="dialogButtons"
      max-width="md"
    >
      <template #header>
        {{ isInWorkspace && !isAdmin ? 'Add to project' : 'Invite to project' }}
      </template>
      <p v-if="isInWorkspace" class="text-foreground text-body-xs mb-3">
        {{
          isAdmin
            ? 'Search for existing workspace users or invite new users.'
            : 'Search for existing workspace users.'
        }}
      </p>
      <form @submit="onSubmit">
        <div class="flex flex-col gap-y-3 text-foreground">
          <template v-for="(item, index) in fields" :key="item.key">
            <InviteDialogProjectRow
              v-model="item.value"
              :project="project"
              :item="item"
              :index="index"
              :show-delete="fields.length > 1"
              show-project-roles
              :show-label="index === 0"
              @remove="removeInvite(index)"
              @update:model-value="(value: InviteProjectItem) => (item.value = value)"
              @add-multiple-emails="addMultipleEmails"
            />
          </template>
          <div>
            <FormButton color="subtle" :icon-left="Plus" @click="addInviteItem">
              Add another user
            </FormButton>
          </div>
        </div>
      </form>
      <p v-if="!isAdmin && isInWorkspace" class="text-foreground-2 text-body-2xs py-3">
        As a project owner you can only add existing workspace users to the project. Ask
        a workspace admin if you need to invite new users to the workspace.
      </p>
      <p v-else-if="workspaceCostInfo" class="text-foreground-2 text-body-2xs py-3">
        {{ workspaceCostInfo }}
      </p>
    </LayoutDialog>
    <WorkspaceAdditionalSeatsChargeDisclaimer
      v-model:open="showAdditionalSeatsDisclaimer"
      :editor-count="purchasableEditorCount"
      :workspace-slug="workspaceSlug"
      @confirm="sendInvites"
    />
  </div>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import { useForm, useFieldArray } from 'vee-validate'
import { Plus } from 'lucide-vue-next'
import type { InviteProjectForm, InviteProjectItem } from '~~/lib/invites/helpers/types'
import { emptyInviteProjectItem } from '~~/lib/invites/helpers/constants'
import type {
  InviteDialogProject_ProjectFragment,
  ProjectInviteCreateInput,
  WorkspaceProjectInviteCreateInput
} from '~/lib/common/generated/gql/graphql'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { Roles, SeatTypes } from '@speckle/shared'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

graphql(`
  fragment InviteDialogProject_Project on Project {
    id
    name
    workspaceId
    workspace {
      id
      name
      role
      domainBasedMembershipProtectionEnabled
      domains {
        domain
        id
      }
      ...WorkspacesPlan_Workspace
    }
    ...InviteDialogProjectRow_Project
  }
`)

const props = defineProps<{
  project: InviteDialogProject_ProjectFragment
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const createInvite = useInviteUserToProject()
const { handleSubmit } = useForm<InviteProjectForm>({
  initialValues: {
    fields: [
      {
        ...emptyInviteProjectItem,
        projectRole: Roles.Stream.Reviewer
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

const showAdditionalSeatsDisclaimer = ref(false)

const workspaceSlug = computed(() => props.project.workspace?.slug || '')
const { isPaidPlan, editorSeatPriceWithIntervalFormatted } =
  useWorkspacePlan(workspaceSlug)

const isInWorkspace = computed(() => !!props.project.workspaceId)
const isAdmin = computed(() => props.project.workspace?.role === Roles.Workspace.Admin)
const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (isOpen.value = false)
  },

  {
    text: isInWorkspace.value && !isAdmin.value ? 'Add' : 'Invite',
    props: {
      submit: true
    },
    onClick: onSubmit
  }
])

const workspaceCostInfo = computed(() => {
  if (!isPaidPlan.value || !isInWorkspace.value) return ''
  return `Viewer seats are free. You'll be charged ${editorSeatPriceWithIntervalFormatted.value} for each Editor seat when they accept. We'll use any unused Editor seats from your plan first.`
})

const purchasableEditorCount = computed(() => {
  if (!isPaidPlan.value) return 0
  const seatsAvailable = props.project.workspace?.seats?.editors?.available || 0
  const newEditorContributors = fields.value.filter((i) => {
    // Has to be a contributor
    if (i.value.projectRole !== Roles.Stream.Contributor) return false

    // Has to not have a seat already
    if (i.value.userInfo?.seatType === SeatTypes.Editor) return false
    return true
  }).length
  return Math.max(0, newEditorContributors - seatsAvailable)
})

const addInviteItem = () => {
  pushInvite({
    ...emptyInviteProjectItem,
    project: { id: props.project.id, name: props.project.name }
  })
}

const addMultipleEmails = (emails: string[]) => {
  const existingEmails = fields.value.map((field) => field.value.email?.toLowerCase())
  const newEmails = emails.filter(
    (email) => !existingEmails.includes(email.toLowerCase())
  )

  newEmails.forEach((email) => {
    pushInvite({
      ...emptyInviteProjectItem,
      project: { id: props.project.id, name: props.project.name },
      email,
      projectRole: Roles.Stream.Reviewer
    })
  })
}

const onSubmit = () => {
  if (purchasableEditorCount.value > 0) {
    showAdditionalSeatsDisclaimer.value = true
  } else {
    sendInvites()
  }
}

const sendInvites = handleSubmit(async () => {
  const invites = fields.value
    .filter((invite) => invite.value.email || invite.value.userId)
    .map((invite) => invite.value)

  const inputs: Array<ProjectInviteCreateInput | WorkspaceProjectInviteCreateInput> =
    invites.map((u) => ({
      role: u.projectRole,
      ...(isInWorkspace.value
        ? isAdmin.value && !u.userId
          ? { email: u.email }
          : { userId: u.userId }
        : { email: u.email }),
      ...(isInWorkspace.value
        ? {
            workspaceRole: u.userInfo?.role || Roles.Workspace.Guest
          }
        : {}),
      ...(isInWorkspace.value && u.projectRole !== Roles.Stream.Reviewer
        ? { seatType: SeatTypes.Editor }
        : {})
    }))

  if (!inputs.length) {
    isOpen.value = false
    return
  }

  const result = await createInvite(props.project.id, inputs)

  if (result?.id) {
    mixpanel.track('Invite Action', {
      type: 'project invite',
      name: 'send',
      multiple: inputs.length !== 1,
      count: inputs.length,
      hasProject: true,
      isNewWorkspaceMember: isAdmin.value,
      // eslint-disable-next-line camelcase
      workspace_id: props.project.workspace?.id
    })

    isOpen.value = false
  }
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
