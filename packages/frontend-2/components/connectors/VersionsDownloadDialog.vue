<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <template #header>
      <div class="flex items-center space-x-2 leading-tight">
        <img :src="tag.feature_image" alt="featured image" class="w-12" />
        <span class="truncate w-full">{{ tag.name }}</span>
      </div>
    </template>
    <div class="flex flex-col space-y-2">
      <div class="text-foreground text-sm mb-4">
        {{ tag.description }}
      </div>
      <div class="flex flex-col space-y-2 pb-1">
        <FormButton
          v-if="latestStableVersions.win"
          full-width
          @click="downloadVersion(latestStableVersions.win as ConnectorVersion)"
        >
          Download latest stable ({{ latestStableVersions.win.Number }}) Windows
        </FormButton>
        <FormButton
          v-if="latestStableVersions.mac"
          full-width
          text
          @click="downloadVersion(latestStableVersions.mac as ConnectorVersion)"
        >
          Download latest stable ({{ latestStableVersions.mac.Number }}) Mac OS
        </FormButton>
      </div>
      <div class="flex items-center justify-between pt-5 gap-6 border-t">
        <div class="h6 font-medium">All releases</div>
        <div class="w-full max-w-[50%]">
          <FormTextInput
            v-model="searchString"
            name="search"
            :custom-icon="MagnifyingGlassIcon"
            full-width
            search
            :show-clear="!!searchString"
            placeholder="Search for a version"
            class="text-sm"
          />
        </div>
      </div>
      <div class="h-40 simple-scrollbar overflow-y-scroll space-y-2">
        <template v-if="searchedVersions.length">
          <div
            v-for="version in searchedVersions"
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
              <FormButton size="sm" text @click="downloadVersion(version)">
                <span class="text-xs font-medium">
                  {{ version.Os === 0 ? 'Windows' : 'MacOS' }}
                </span>
                <CloudArrowDownIcon class="w-4 h-4" />
              </FormButton>
            </div>
          </div>
        </template>

        <div v-if="searchedVersions.length === 0" class="text-foreground-2">
          No versions found.
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { CloudArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid'
import type { ConnectorTag, ConnectorVersion } from '~~/lib/connectors'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
  tag: ConnectorTag
}>()

const searchString = ref<string>()

const versions = computed(() => props.tag.versions)

const searchedVersions = computed(() =>
  searchString.value
    ? versions.value.filter((v) =>
        v.Number.toLowerCase().includes((searchString.value as string).toLowerCase())
      )
    : versions.value
)

const latestStableVersions = computed(() => {
  const latest = versions.value.find((v) => !v.Prerelease)
  const allLatest = versions.value.filter((v) => v.Number === latest?.Number)
  return {
    win: allLatest.find((v) => v.Os === 0),
    mac: allLatest.find((v) => v.Os === 1)
  }
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
