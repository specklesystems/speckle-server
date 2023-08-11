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
        @server-info-updated="fetchData"
      />

      <Card :server-info="userData" />
      <Card :server-info="projectData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { ref, computed, onMounted } from 'vue'
import Card from '../../components/server-management/Card.vue'
import SettingsDialog from '../../components/server-management/SettingsDialog.vue'
import { CardInfo, SettingsDialogRef } from '~~/lib/server-management/helpers/types'
import {
  ServerIcon,
  UsersIcon,
  EnvelopeIcon,
  ChartBarIcon,
  HomeIcon
} from '@heroicons/vue/24/solid'

interface GithubRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  node_id: string
  tag_name: string
}

const router = useRouter()

const showDialog = ref(false)
const settingsDialog = ref<SettingsDialogRef | null>(null)
const latestVersion = ref<string | null>(null)
const isLatestVersion = ref<boolean>(false)

const closeDialog = () => {
  showDialog.value = false
}

const saveSettings = () => {
  if (settingsDialog.value) {
    settingsDialog.value.onSubmit()
  }
}

async function getLatestVersion(): Promise<string | null> {
  try {
    const response: Response = await fetch(
      'https://api.github.com/repos/specklesystems/speckle-server/releases/latest'
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    } else {
      const data = (await response.json()) as GithubRelease
      return data.tag_name
    }
  } catch (err) {
    console.error('Error fetching latest version:', err)
    return null
  }
}

onMounted(async () => {
  latestVersion.value = await getLatestVersion()
  isLatestVersion.value =
    versionInfo.current === latestVersion.value || versionInfo.current === 'dev'
})

const dataQuery = graphql(`
  query AdminPageData {
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

const { result, refetch } = useQuery(dataQuery)
const versionInfo = reactive({
  current: result.value?.serverInfo.version || 'N/A',
  latest: latestVersion.value || 'N/A'
})

const fetchData = () => {
  refetch()
}

onMounted(fetchData)

const serverData = computed((): CardInfo[] => [
  {
    title: 'Server Name',
    value: result.value?.serverInfo.name || 'N/A',
    icon: ServerIcon,
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
    value: versionInfo.current,
    icon: ChartBarIcon,
    cta: !isLatestVersion.value
      ? {
          type: 'link',
          label: 'Update is available',
          action: () => {
            window.open(
              'https://github.com/specklesystems/speckle-server/releases',
              '_blank'
            )
          }
        }
      : undefined
  }
])
const userData = computed(() => [
  {
    title: 'Active users',
    value: result.value?.admin.serverStatistics.totalUserCount?.toString() || 'N/A',
    icon: UsersIcon,
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/server-management/active-users/')
    }
  },
  {
    title: 'Pending invitations',
    value: result.value?.admin.serverStatistics.totalPendingInvites?.toString() || '0',
    icon: EnvelopeIcon,
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
    icon: HomeIcon,
    cta: {
      type: 'button',
      label: 'Manage',
      action: async () => await router.push('/projects/')
    }
  }
])
</script>
