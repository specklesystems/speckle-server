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
          classes: 'col-span-7 whitespace-break-spaces text-xs'
        }
      ]"
      :items="applications"
      :buttons="[
        {
          icon: LockOpenIcon,
          label: 'Reveal Secret',
          action: openRevealSecretDialog,
          class: 'text-primary'
        },
        {
          icon: PencilIcon,
          label: 'Edit',
          action: openEditApplicationDialog,
          class: 'text-primary'
        },
        {
          icon: TrashIcon,
          label: 'Delete',
          action: (item) => $emit('delete', item),
          class: 'text-danger'
        }
      ]"
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
  TrashIcon,
  PencilIcon,
  LockOpenIcon
} from '@heroicons/vue/24/outline'
import { developerSettingsApplicationsQuery } from '~~/lib/developer-settings/graphql/queries'
import type { ApplicationItem } from '~~/lib/developer-settings/helpers/types'

defineEmits<{
  (e: 'delete', item: ApplicationItem): void
}>()

const { result: applicationsResult, refetch: refetchApplications } = useQuery(
  developerSettingsApplicationsQuery
)

const showCreateEditApplicationDialog = ref(false)
const showCreateApplicationSuccessDialog = ref(false)
const showRevealSecretDialog = ref(false)
const applicationToEdit = ref<ApplicationItem | null>(null)
const applicationToReveal = ref<ApplicationItem | null>(null)
const createdApplication = ref<ApplicationItem | null>(null)

const applications = computed<ApplicationItem[]>(() => {
  return applicationsResult.value?.activeUser?.createdApps || []
})

const openCreateApplicationDialog = () => {
  applicationToEdit.value = null
  showCreateEditApplicationDialog.value = true
}

const openEditApplicationDialog = (item: ApplicationItem) => {
  applicationToEdit.value = item
  showCreateEditApplicationDialog.value = true
}

const openRevealSecretDialog = (item: ApplicationItem) => {
  applicationToReveal.value = item
  showRevealSecretDialog.value = true
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
