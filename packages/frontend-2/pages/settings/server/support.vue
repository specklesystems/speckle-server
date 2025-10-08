<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="External Sync"
        text="Sync versions from external Speckle servers into your local projects"
      />

      <div class="flex flex-col gap-6">
        <SettingsSectionHeader title="Sync a Version" subheading />

        <div v-if="!syncResult">
          <p class="text-sm text-foreground-2 mb-6">
            Enter the URL of a version from an external Speckle server to sync it into a
            local project. The version must be publicly accessible or you must have
            access to it.
          </p>

          <SettingsServerSyncForm
            ref="formRef"
            :loading="loading"
            @submit="handleSync"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSyncVersion } from '~~/lib/settings/composables/management'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { getFirstErrorMessage } from '~~/lib/common/helpers/graphql'
import type { Nullable } from '@speckle/shared'

definePageMeta({
  middleware: [
    () => {
      const isEnabled = useAdminSupportUIEnabled()
      if (!isEnabled) {
        return abortNavigation({
          statusCode: 404,
          statusMessage: 'Not Found'
        })
      }
    }
  ],
  layout: 'settings'
})

useHead({
  title: 'Settings | Server - External Sync'
})

const { mutate: syncVersion, loading } = useSyncVersion()
const { triggerNotification } = useGlobalToast()

const formRef = ref<{ reset: () => void } | null>(null)
const syncResult = ref<{
  localVersionUrl: string
  projectId: string
  modelId: Nullable<string>
  versionId: string
} | null>(null)

const handleSync = async (params: {
  versionUrl: string
  projectId: string
  modelId: Nullable<string>
}) => {
  const result = await syncVersion({
    versionUrl: params.versionUrl,
    projectId: params.projectId,
    modelId: params.modelId
  })

  if (result?.data?.serverMutations?.syncVersion) {
    const data = result.data.serverMutations.syncVersion
    syncResult.value = {
      localVersionUrl: data.localVersionUrl,
      projectId: data.projectId,
      modelId: data.modelId,
      versionId: data.versionId
    }

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Version synced successfully',
      description: 'The version has been synced to your local project'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Sync failed',
      description: errorMessage || 'Failed to sync version from external server'
    })
  }
}
</script>
