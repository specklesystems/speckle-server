<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Invite to server</template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-y-5 text-foreground mb-4">
        <div v-for="(item, index) in fields" :key="item.key" class="flex gap-x-3">
          <div class="flex flex-col gap-y-3 flex-1">
            <hr v-if="index !== 0" class="border-outline-3" />
            <div class="flex flex-row gap-x-3">
              <div class="flex-1">
                <FormTextInput
                  :name="`email-${index}`"
                  color="foundation"
                  label="E-mail"
                  show-label
                  placeholder="Enter an email to invite"
                  :rules="[isRequired, isEmail]"
                  :disabled="anyMutationsLoading"
                  @input="
                    (e) =>
                      updateField({ field: InputFields.Email, val: e.value, index })
                  "
                />
              </div>
              <FormSelectServerRoles
                v-if="allowServerRoleSelect"
                label="Select role"
                class="sm:w-48"
                show-label
                :disabled="anyMutationsLoading"
                :allow-guest="isGuestMode"
                :allow-admin="isAdmin"
                :name="`role-${index}`"
                :rules="[isRequired]"
                mount-menu-on-body
                @update:model-value="(e) => onUpdateRole(e, index)"
              />
            </div>
            <FormSelectProjects
              label="Select project"
              class="w-full"
              owned-only
              show-optional
              mount-menu-on-body
              show-label
              :name="`project-${index}`"
              @update:model-value="(e) => onUpdateProject(e, index)"
            />
          </div>
          <div class="relative w-4">
            <CommonTextLink
              v-if="inviteItems.length > 1"
              class="top-10 absolute right-0"
              :class="{ 'top-7': index === 0 }"
              @click="removeInvite(index)"
            >
              <TrashIcon class="h-4 w-4 text-foreground-2" />
            </CommonTextLink>
          </div>
        </div>

        <FormButton
          color="subtle"
          :icon-left="PlusIcon"
          :disabled="anyMutationsLoading"
          @click="addInviteItem"
        >
          Invite another user
        </FormButton>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined, ServerRoles } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { useMutationLoading } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useServerInfo } from '~~/lib/core/composables/server'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { useInviteUserToServer } from '~~/lib/server/composables/invites'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { isRequired, isEmail } from '~~/lib/common/helpers/validation'
import { useForm, useFieldArray } from 'vee-validate'

type InviteItem = {
  email: string
  serverRole: MaybeNullOrUndefined<ServerRoles>
  projectId: MaybeNullOrUndefined<string>
}

enum InputFields {
  Email = 'email',
  Role = 'role',
  Project = 'project'
}

const { handleSubmit } = useForm({
  initialValues: {
    invites: [
      {
        email: '',
        serverRole: null,
        projectId: null
      }
    ]
  }
})
const { remove: removeInvite, push: addInvite, fields } = useFieldArray('invites')
const { mutate: inviteUserToServer } = useInviteUserToServer()
const inviteUserToProject = useInviteUserToProject()
const anyMutationsLoading = useMutationLoading()
const { isAdmin } = useActiveUser()
const { isGuestMode } = useServerInfo()

const inviteItems = ref<InviteItem[]>([
  {
    email: '',
    serverRole: null,
    projectId: null
  }
])

const isOpen = defineModel<boolean>('open', { required: true })

const allowServerRoleSelect = computed(() => isAdmin.value || isGuestMode.value)

const mp = useMixpanel()

const onSubmit = handleSubmit(() => {
  inviteItems.value.forEach(async (invite: InviteItem) => {
    const success = invite.projectId
      ? await inviteUserToProject(invite.projectId, [
          {
            email: invite.email,
            serverRole: invite.serverRole
          }
        ])
      : await inviteUserToServer([
          {
            email: invite.email,
            serverRole: invite.serverRole
          }
        ])

    if (success) {
      const hasProject = !!invite.projectId

      mp.track('Invite Action', {
        type: hasProject ? 'project invite' : 'server invite',
        name: 'send',
        hasProject,
        to: 'email'
      })
    }
  })

  isOpen.value = false
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Send',
    props: {
      submit: true,
      disabled: anyMutationsLoading.value
    },
    onClick: onSubmit
  }
])

const addInviteItem = () => {
  addInvite({
    email: '',
    serverRole: null,
    projectId: null
  })
}

const onUpdateRole = (val: ServerRoles | ServerRoles[] | undefined, index: number) => {
  if (Array.isArray(val)) {
    throw new Error('Multiple roles are not supported')
  }
  updateField({ field: InputFields.Role, val, index })
}

const onUpdateProject = (
  val:
    | FormSelectProjects_ProjectFragment
    | FormSelectProjects_ProjectFragment[]
    | undefined,
  index: number
) => {
  if (Array.isArray(val)) {
    throw new Error('Multiple projects not supported')
  }
  updateField({ field: InputFields.Project, val: val?.id, index })
}

const updateField = ({
  field,
  val,
  index
}: {
  field: InputFields
  val?: string
  index: number
}) => {
  inviteItems.value[index] = {
    ...inviteItems.value[index],
    [field]: val
  }
}
</script>
