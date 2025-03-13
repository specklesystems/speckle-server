<template>
  <div>
    <CommonCard class="flex flex-1 flex-col gap-1 !p-4 !pt-2 !pb-3">
      <div class="flex gap-2 items-center">
        <img
          v-if="connector.image"
          :src="connector.image"
          :alt="`${connector.title} logo`"
          class="w-[48px] -ml-1"
        />
        <div class="flex flex-col gap-y-1.5">
          <h2 class="text-body-xs text-foreground font-medium leading-none">
            {{ connector.title }}
          </h2>
        </div>
      </div>
      <p class="text-body-2xs text-foreground-2 line-clamp-2 leading-5">
        {{ connector.description }}
      </p>
      <div class="space-x-1 mt-2">
        <FormButton
          color="outline"
          size="sm"
          :disabled="enableButton"
          external
          :to="latestAvailableVersion?.Url"
          @click="
            mixpanel.track('Connector Card Install Clicked', {
              connector: props.connector.slug
            })
          "
        >
          {{ connector.isComingSoon ? 'Coming soon' : 'Install for Windows' }}
        </FormButton>
        <FormButton
          v-if="connector.url"
          color="subtle"
          size="sm"
          target="_blank"
          external
          :to="connector.url"
          @click="
            mixpanel.track('Connector Card Documentation Clicked', {
              connector: props.connector.slug
            })
          "
        >
          Documentation
        </FormButton>
      </div>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import type { ConnectorItem, Version, Versions } from '~~/lib/dashboard/helpers/types'
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  connector: ConnectorItem
}>()

const mixpanel = useMixpanel()
const { data: versionData, status } = useFetch(
  `https://releases.speckle.dev/manager2/feeds/${props.connector.slug}-v3.json`,
  {
    immediate: !props.connector.isComingSoon
  }
)

const enableButton = computed(() => status.value !== 'success')

const latestAvailableVersion = computed<Version | null>(() => {
  if (versionData.value) {
    const typedData = versionData.value as Versions
    const sortedVersions = [...typedData.Versions].sort(
      (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
    )
    return sortedVersions.length > 0 ? sortedVersions[0] : null
  }
  return null
})
</script>
