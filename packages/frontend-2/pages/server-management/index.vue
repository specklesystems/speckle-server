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
            props: { color: 'primary', fullWidth: true },
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
import { useQuery } from '@vue/apollo-composable'
import Card from '../../components/server-management/Card.vue'
import SettingsDialog from '../../components/server-management/SettingsDialog.vue'
import gql from 'graphql-tag'

const router = useRouter()

const showDialog = ref(false)

const closeDialog = () => {
  showDialog.value = false
}

const saveSettings = () => {
  // Code here for saving the settings
}

const GET_SERVER_STATS = gql`
  query ServerStats {
    admin {
      serverStatistics {
        totalPendingInvites
        totalProjectCount
        totalUserCount
      }
    }
  }
`

const { result, loading, error } = useQuery(GET_SERVER_STATS)

const serverData = ref([
  {
    title: 'Server Name',
    value: 'Wonderland',
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
    value: '2.14.8-alpha.44172',
    cta: {
      type: 'link',
      label: 'Update is available',
      action: '#0'
    }
  }
])

const userData = ref([
  {
    title: 'Active users',
    value: result.value?.admin.serverStatistics.totalUserCount || 'N/A',
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/server-management/active-users/')
    }
  },
  {
    title: 'Pending invitations',
    value: result.value?.admin.serverStatistics.totalPendingInvites || '0',
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/server-management/pending-invitations/')
    }
  }
])

const projectData = ref([
  {
    title: 'Projects',
    value: result.value?.admin.serverStatistics.totalProjectCount || 'N/A',
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/projects/')
    }
  }
])
</script>
