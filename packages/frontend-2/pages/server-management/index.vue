<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="'/server-management'"
        name="Server Management"
      ></HeaderNavLink>
    </Portal>
    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center"
    >
      <div>
        <h5 class="h4 font-bold">Your server at a glance</h5>
      </div>
    </div>

    <!-- Not sure if needed? -->
    <!-- <OnboardingDialogManager
      v-model:open="showManagerDownloadDialog"
      @done="showManagerDownloadDialog = false"
      @cancel="showManagerDownloadDialog = false"
    ></OnboardingDialogManager> -->

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <Card :server-info="serverData" @cta-clicked="showDialog = true" />

      <SettingsDialog
        ref="settingsDialog"
        v-model:open="showDialog"
        title="Edit Settings"
        :buttons="[
          {
            text: 'Cancel',
            props: { color: 'secondary', fullWidth: true, outline: true },
            onClick: closeDialog
          },
          {
            text: 'Save',
            props: { color: 'primary', fullWidth: true, outline: false },
            onClick: saveSettings
          }
        ]"
      />

      <Card :server-info="userData" />
      <Card :server-info="projectData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import Card from '../../components/server-management/Card.vue'
import SettingsDialog from '../../components/server-management/SettingsDialog.vue'
import { SettingsDialogRef } from '~~/lib/server-management/helpers/types'

const router = useRouter()

const showDialog = ref(false)
const settingsDialog = ref<SettingsDialogRef | null>(null)

const closeDialog = () => {
  showDialog.value = false
}

const saveSettings = () => {
  if (settingsDialog.value) {
    settingsDialog.value.onSave()
  }
}

const dataQuery = graphql(`
  query ServerStatistics {
    admin {
      serverStatistics {
        totalPendingInvites
        totalProjectCount
        totalUserCount
      }
    }
    serverInfo {
      name
      version
    }
  }
`)

const { result } = useQuery(dataQuery)

const serverData = computed(() => [
  {
    title: 'Server Name',
    value: result.value?.serverInfo.name || 'N/A',
    cta: {
      type: 'button',
      label: 'Edit Settings',
      action: () => {
        showDialog.value = true
      }
    }
  },
  {
    title: 'Speckle Version',
    value: result.value?.serverInfo.version || 'N/A',
    cta: {
      type: 'link',
      label: 'Update is available',
      action: () => {
        router.push('/update-link')
      }
    }
  }
])

const userData = computed(() => [
  {
    title: 'Active users',
    value: result.value?.admin.serverStatistics.totalUserCount?.toString() || 'N/A',
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/server-management/active-users/')
    }
  },
  {
    title: 'Pending invitations',
    value: result.value?.admin.serverStatistics.totalPendingInvites?.toString() || '0',
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/server-management/pending-invitations/')
    }
  }
])

const projectData = computed(() => [
  {
    title: 'Projects',
    value: result.value?.admin.serverStatistics.totalProjectCount?.toString() || 'N/A',
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/projects/')
    }
  }
])
</script>
