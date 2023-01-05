<template>
  <div
    class="rounded-md bg-foundation shadow transition hover:scale-[1.02] border-2 border-transparent hover:border-outline-2 hover:shadow-xl"
    @focusin="hovered = true"
    @focusout="hovered = false"
    @mouseenter="hovered = true"
    @mouseleave=";(showActionsMenu = false), (hovered = false)"
  >
    <!--
      Nested anchors are causing a hydration mismatch for some reason (template renders wrong in SSR), could be a Vue bug?
      TODO: Report it to Vue/Nuxt!
    -->
    <NuxtLink :href="modelRoute(projectId, model.id)">
      <div :class="`${height} flex items-center justify-center`">
        <ProjectPageModelsPreview v-if="model.versionCount !== 0" :model="model" />
        <div v-else class="h-full w-full p-4">
          <div
            class="rounded-xl p-4 flex items-center h-full w-full border-dashed border-2 border-blue-500/10 text-foreground-2 text-xs text-center"
          >
            <div :class="`opacity-50 ${hovered ? 'opacity-100' : ''}`">
              Use our
              <b>connectors</b>
              to send data to this model, or drag and drop a IFC/OBJ/STL file here.
            </div>
          </div>
        </div>
      </div>
      <div class="h-12 flex items-center px-2 py-1 space-x-1">
        <div class="flex-grow">
          <div v-if="path" class="text-xs text-foreground-2 relative -mb-1 truncate">
            {{ path }}/
          </div>
          <div class="font-bold truncate">{{ name }}</div>
        </div>

        <div
          :class="`text-xs text-foreground-2 mr-1 opacity-0 truncate transition ${
            hovered ? 'opacity-100' : ''
          }`"
        >
          updated
          <b>{{ updatedAt }}</b>
        </div>

        <FormButton
          v-if="showVersions"
          rounded
          size="xs"
          :icon-left="ArrowPathRoundedSquareIcon"
          :to="modelVersionsRoute(projectId, model.id)"
          :class="`opacity-0 ${hovered ? 'opacity-100' : ''}`"
          :disabled="model.versionCount === 0"
        >
          {{ model?.versionCount }}
        </FormButton>
        <div v-if="showActions">
          <!-- TODO with proper disclosure menu or whatever -->
          <FormButton size="sm" text @click.stop="showActionsMenu = !showActionsMenu">
            <EllipsisVerticalIcon class="w-4 h-4" />
          </FormButton>
        </div>
      </div>
    </NuxtLink>
    <div
      v-show="showActionsMenu"
      class="absolute -bottom-10 right-2 rounded-md bg-foundation-2 w-52 shadow-md divide-y text-sm"
    >
      <div class="px-2 py-1">TODO</div>
      <div class="px-2 py-1">rename</div>
      <div class="px-2 py-1 text-danger">delete</div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { ProjectPageLatestItemsModelItemFragment } from '~~/lib/common/generated/gql/graphql'
import {
  ArrowPathRoundedSquareIcon,
  EllipsisVerticalIcon
} from '@heroicons/vue/24/solid'
import { modelRoute, modelVersionsRoute } from '~~/lib/common/helpers/route'

const props = withDefaults(
  defineProps<{
    model: ProjectPageLatestItemsModelItemFragment
    projectId: string
    showVersions?: boolean
    showActions?: boolean
    height?: string
  }>(),
  {
    showVersions: true,
    showActions: true,
    height: 'h-64'
  }
)

const showActionsMenu = ref(false)
const hovered = ref(false)
const name = computed(() => {
  return props.model.name.split('/').reverse()[0]
})

const path = computed(() => {
  const parts = props.model.name.split('/')
  if (parts.length > 1) {
    return parts.slice(0, parts.length - 1).join('/')
  } else {
    return null
  }
})

const updatedAt = computed(() => dayjs(props.model.updatedAt).from(dayjs()))
</script>
