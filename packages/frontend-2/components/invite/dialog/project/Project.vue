<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <LayoutDialog
    v-model:open="isOpen"
    prevent-close-on-click-outside
    :buttons="dialogButtons"
    max-width="md"
  >
    <template #header>Invite to project</template>
    <p v-if="isInWorkspace" class="text-foreground text-body-sm mb-3">
      Search existing workspace members or invite entirely new.
    </p>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-y-3 text-foreground">
        <template v-for="(item, index) in fields" :key="item.key">
          <InviteDialogProjectRow
            v-model="item.value"
            :item="item"
            :index="index"
            :show-delete="fields.length > 1"
            :can-invite-new-members="isAdmin || !isInWorkspace"
            :show-project-roles="!isInWorkspace"
            :show-label="index === 0"
            :is-in-workspace="isInWorkspace"
            @remove="removeInvite(index)"
            @update:model-value="(value: InviteProjectItem) => (item.value = value)"
            @add-multiple-emails="addMultipleEmails"
          />
        </template>
        <div>
          <FormButton color="subtle" :icon-left="PlusIcon" @click="addInviteItem">
            Add another user
          </FormButton>
        </div>
      </div>
    </form>
    <p v-if="!isAdmin && isInWorkspace" class="text-foreground-2 text-body-2xs py-3">
      As a project owner you can only add existing workspace members to the project. Ask
      a workspace admin if you need to invite new people to the workspace.
    </p>
    <p v-else-if="isInWorkspace" class="text-foreground-2 text-body-2xs py-3">
      New people you invite will join as workspace guests on a free Viewer seat with
      access only to this project. Give them an Editor seat later if they need to
      contribute to this project beyond just viewing and commenting.
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import { useForm, useFieldArray } from 'vee-validate'
import { PlusIcon } from '@heroicons/vue/24/outline'
import type { InviteProjectForm, InviteProjectItem } from '~~/lib/invites/helpers/types'
import { emptyInviteProjectItem } from '~~/lib/invites/helpers/constants'
import type {
  InviteDialogProject_ProjectFragment,
  ProjectInviteCreateInput,
  WorkspaceProjectInviteCreateInput
} from '~/lib/common/generated/gql/graphql'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { Roles } from '@speckle/shared'

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
    }
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

const isInWorkspace = computed(() => !!props.project.workspaceId)
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

const onSubmit = handleSubmit(async () => {
  const invites = fields.value
    .filter((invite) => invite.value.email || invite.value.userId)
    .map((invite) => invite.value)

  const inputs: ProjectInviteCreateInput[] | WorkspaceProjectInviteCreateInput[] =
    invites.map((u) => ({
      role: u.projectRole,
      ...(isInWorkspace.value
        ? isAdmin.value && !u.userId
          ? { email: u.email }
          : { userId: u.userId }
        : { email: u.email }),
      ...(props.project?.workspace?.id
        ? {
            workspaceRole: Roles.Workspace.Guest
          }
        : {})
    }))

  if (!inputs.length) {
    isOpen.value = false
    return
  }

  await createInvite(props.project.id, inputs)

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
