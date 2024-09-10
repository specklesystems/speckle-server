<template>
  <div class="flex flex-col gap-4">
    <SettingsSectionHeader
      subheading
      title="Applications"
      :buttons="[
        {
          props: {
            color: 'outline',
            to: 'https://speckle.guide/dev/apps.html',
            target: '_blank',
            external: true,
            iconLeft: BookOpenIcon
          },
          label: 'Open docs'
        },
        {
          props: {
            onClick: openCreateApplicationDialog,
            iconLeft: PlusIcon
          },
          label: 'New application'
        }
      ]"
    >
      <p class="text-body-xs pt-6 md:pt-4 text-foreground">
        Register and manage third-party Speckle Apps that, once authorised by a user on
        this server, can act on their behalf.
      </p>
    </SettingsSectionHeader>
    <LayoutTable
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'id', header: 'ID', classes: 'col-span-2' },
        {
          id: 'scope',
          header: 'Scope',
          classes: 'col-span-6 whitespace-break-spaces text-xs'
        },
        { id: 'actions', header: '', classes: 'col-span-1 flex justify-end' }
      ]"
      :items="applications"
    >
      <template #name="{ item }">
        {{ item.name }}
      </template>
      <template #id="{ item }">
        <span class="rounded text-xs font-mono bg-foundation-page p-2">
          {{ item.id }}
        </span>
      </template>

      <template #scope="{ item }">
        {{ getItemScopes(item) }}
      </template>

      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu[item.id]"
          :items="actionItems"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem, item)"
        >
          <FormButton
            :color="showActionsMenu[item.id] ? 'outline' : 'subtle'"
            hide-text
            :icon-right="showActionsMenu[item.id] ? XMarkIcon : EllipsisHorizontalIcon"
            @click.stop="toggleMenu(item.id)"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>

    <SettingsUserDeveloperApplicationsCreateEditDialog
      v-model:open="showCreateEditApplicationDialog"
      :application="applicationToEdit"
      @application-created="handleApplicationCreated"
    />
    <SettingsUserDeveloperApplicationsSuccessDialog
      v-model:open="showCreateApplicationSuccessDialog"
      :application="createdApplication"
    />
    <SettingsUserDeveloperApplicationsRevealSecretDialog
      v-model:open="showRevealSecretDialog"
      :application="applicationToReveal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import {
  PlusIcon,
  BookOpenIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { developerSettingsApplicationsQuery } from '~~/lib/developer-settings/graphql/queries'
import type { ApplicationItem } from '~~/lib/developer-settings/helpers/types'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'

const emit = defineEmits<{
  (e: 'delete', item: ApplicationItem): void
}>()

const { result: applicationsResult, refetch: refetchApplications } = useQuery(
  developerSettingsApplicationsQuery
)

const showCreateEditApplicationDialog = ref(false)
const showCreateApplicationSuccessDialog = ref(false)
const showRevealSecretDialog = ref(false)
const showActionsMenu = ref<Record<string, boolean>>({})
const applicationToEdit = ref<ApplicationItem | undefined>(undefined)
const applicationToReveal = ref<ApplicationItem | null>(null)
const createdApplication = ref<ApplicationItem | null>(null)

const applications = computed<ApplicationItem[]>(() => {
  return applicationsResult.value?.activeUser?.createdApps || []
})

enum ActionTypes {
  EditApplication = 'edit-application',
  RevealSecret = 'reveal-secret',
  RemoveApplication = 'remove-application'
}

const actionItems: LayoutMenuItem[][] = [
  [
    {
      title: 'Edit application...',
      id: ActionTypes.EditApplication
    },
    {
      title: 'Reveal secret...',
      id: ActionTypes.RevealSecret
    },
    {
      title: 'Remove application...',
      id: ActionTypes.RemoveApplication
    }
  ]
]

const onActionChosen = (actionItem: LayoutMenuItem, application: ApplicationItem) => {
  if (actionItem.id === ActionTypes.EditApplication) {
    openEditApplicationDialog(application)
  } else if (actionItem.id === ActionTypes.RevealSecret) {
    applicationToReveal.value = application
    showRevealSecretDialog.value = true
  } else if (actionItem.id === ActionTypes.RemoveApplication) {
    emit('delete', application)
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}

const openCreateApplicationDialog = () => {
  applicationToEdit.value = undefined
  showCreateEditApplicationDialog.value = true
}

const openEditApplicationDialog = (item: ApplicationItem) => {
  applicationToEdit.value = item
  showCreateEditApplicationDialog.value = true
}

const handleApplicationCreated = (applicationId: string) => {
  refetchApplications()?.then(() => {
    const newApplication = applications.value.find((app) => app.id === applicationId)

    if (newApplication) {
      createdApplication.value = newApplication
      showCreateApplicationSuccessDialog.value = true
    }
  })
}

const getItemScopes = (item: ApplicationItem): string => {
  if (!item.scopes || item.scopes.length === 0) return 'No scopes available'

  return item.scopes
    .map((scope) => {
      if (typeof scope === 'string') return `"${scope}"`
      if (typeof scope === 'object' && scope !== null) {
        return `"${scope.name}"`
      }
    })
    .join(', ')
}
</script>
