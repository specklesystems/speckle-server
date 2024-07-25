<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="group rounded-xl bg-foundation-2 border border-transparent hover:border-outline-2"
    @mouseleave="showActionsMenu = false"
  >
    <div class="flex flex-col p-3 pt-2" @click="$emit('click', $event)">
      <div class="flex justify-between items-center">
        <NuxtLink
          class="text-body-xs font-medium truncate text-foreground pl-1"
          :href="viewerRoute"
        >
          {{ message }}
        </NuxtLink>
        <ProjectModelPageVersionsCardActions
          v-if="!isPendingVersionFragment(version)"
          v-model:open="showActionsMenu"
          :project-id="projectId"
          :model-id="modelId"
          :version-id="version.id"
          :selection-disabled="selectionDisabled"
          @select="onSelect"
          @chosen="$emit('chosen', $event)"
          @embed="$emit('embed')"
        />
      </div>
      <div>
        <div
          class="h-48 flex items-center justify-center relative bg-foundation border border-outline-3 mb-3 mt-2 rounded-xl"
        >
          <ProjectPendingFileImportStatus
            v-if="isPendingVersionFragment(version)"
            :upload="version"
            class="px-4 w-full text-foreground-2 text-sm flex flex-col items-center space-y-1"
          />
          <template v-else>
            <NuxtLink :href="viewerRoute" class="h-full w-full">
              <PreviewImage :preview-url="version.previewUrl" />
            </NuxtLink>
            <div
              v-if="!isPendingVersionFragment(version) && version.automationsStatus"
              class="absolute top-1 left-0 p-2"
            >
              <AutomateRunsTriggerStatus
                :project-id="projectId"
                :status="version.automationsStatus"
                :model-id="modelId"
                :version-id="version.id"
              />
            </div>
            <div
              v-if="version.commentThreadCount.totalCount !== 0"
              class="absolute top-0 right-0 p-2 flex items-center h-8 bg-foundation border border-outline-2 justify-center rounded-tr-full rounded-tl-full rounded-br-full text-xs m-2"
            >
              <ChatBubbleLeftRightIcon class="w-4 h-4" />
              <span>{{ version.commentThreadCount.totalCount }}</span>
            </div>
          </template>
        </div>
        <div class="flex items-center">
          <FormCheckbox
            v-if="isSelectable"
            v-model="checkboxModel"
            v-tippy="
              selectionDisabled
                ? `To select this version you must be its or its project's owner`
                : undefined
            "
            name="selected"
            hide-label
            :value="true"
            :disabled="selectionDisabled"
          />
          <div class="text-xs text-foreground-2 mr-1 truncate flex-1">
            Created
            <span v-tippy="createdAt.full">
              {{ createdAt.relative }}
            </span>
          </div>
          <div
            v-if="!isPendingVersionFragment(version)"
            class="flex space-x-1 items-center"
          >
            <UserAvatar :user="version.authorUser" />
            <SourceAppBadge v-if="sourceApp" :source-app="sourceApp" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type {
  PendingFileUploadFragment,
  ProjectModelPageVersionsCardVersionFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { SpeckleViewer, SourceApps } from '@speckle/shared'
import type { VersionActionTypes } from '~~/lib/projects/helpers/components'
import { isPendingVersionFragment } from '~~/lib/projects/helpers/models'
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/solid'

graphql(`
  fragment ProjectModelPageVersionsCardVersion on Version {
    id
    message
    authorUser {
      ...LimitedUserAvatar
    }
    createdAt
    previewUrl
    sourceApplication
    commentThreadCount: commentThreads(limit: 0) {
      totalCount
    }
    ...ProjectModelPageDialogDeleteVersion
    ...ProjectModelPageDialogMoveToVersion
    automationsStatus {
      ...AutomateRunsTriggerStatus_TriggeredAutomationsStatus
    }
  }
`)

const emit = defineEmits<{
  (e: 'click', val: MouseEvent): void
  (e: 'select'): void
  (e: 'update:selected', val: boolean): void
  (e: 'chosen', val: VersionActionTypes): void
  (e: 'embed'): void
}>()

const props = defineProps<{
  version: ProjectModelPageVersionsCardVersionFragment | PendingFileUploadFragment
  projectId: string
  modelId: string
  selectable?: boolean
  selected?: boolean
  selectionDisabled?: boolean
}>()

const showActionsMenu = ref(false)

const createdAt = computed(() => {
  const date = isPendingVersionFragment(props.version)
    ? props.version.convertedLastUpdate || props.version.uploadDate
    : props.version.createdAt

  return {
    full: formattedFullDate(date),
    relative: formattedRelativeDate(date, { prefix: true })
  }
})

const viewerRoute = computed(() => {
  if (isPendingVersionFragment(props.version)) return undefined

  const resourceIdString = SpeckleViewer.ViewerRoute.resourceBuilder()
    .addModel(props.modelId, props.version.id)
    .toString()
  return modelRoute(props.projectId, resourceIdString)
})

const sourceApp = computed(() =>
  SourceApps.find((a) => {
    const sourceApp = isPendingVersionFragment(props.version)
      ? props.version.fileType
      : props.version.sourceApplication

    return sourceApp?.includes(a.searchKey)
  })
)

const isSelectable = computed(
  () => props.selectable && !isPendingVersionFragment(props.version)
)

const message = computed(() => {
  if (isPendingVersionFragment(props.version))
    return `File upload: ${props.version.fileName}`
  return props.version.message || 'no message'
})

const checkboxModel = computed({
  get: () => (isSelectable.value && props.selected ? true : undefined),
  set: (newVal) => emit('update:selected', !!newVal)
})

const onSelect = () => {
  emit('select')
}
</script>
