<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div class="flex flex-col space-y-2">
      <div class="h4 font-bold">
        {{ tag.name }}
      </div>
      <div class="flex flex-col space-y-2">
        <FormButton v-if="latestStable" full-width>
          Download Latest Stable ({{ latestStable.Number }})
        </FormButton>
        <!-- <FormButton full-width text size="sm">Download Latest Pre-release</FormButton> -->
      </div>
      <div class="h6 font-bold">All releases</div>
      <div class="h-40 simple-scrollbar overflow-y-scroll space-y-2">
        <div
          v-for="version in versions"
          :key="version.Number"
          class="flex justify-between text-sm"
        >
          <div class="space-x-2">
            <span>{{ version.Number }}</span>
            <span class="text-foreground-2">
              {{ dayjs(version.Date).from(dayjs()) }}
            </span>
          </div>
          <div class="px-4">
            <FormButton size="sm" text>
              <span class="text-foreground-2 text-xs font-bold">
                {{ version.Os === 0 ? 'Windows' : 'MacOS' }}
              </span>
              <CloudArrowDownIcon class="w-4 h-4" />
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { CloudArrowDownIcon } from '@heroicons/vue/24/solid'
import { ConnectorTag, ConnectorVersion } from '~~/lib/connectors'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  tag: ConnectorTag
}>()

const versions = computed(() => props.tag.versions)

const latestStable = computed(() => {
  return versions.value.find((v) => !v.Prerelease)
})

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const downloadVersion = (version: ConnectorVersion) => {
  // TODO
  const splittedName = version.Url.split('/')

  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  a.href = version.Url
  a.download = splittedName[splittedName.length - 1]
  a.click()
  document.body.removeChild(a)

  // TODO: mixpanel
}
</script>
