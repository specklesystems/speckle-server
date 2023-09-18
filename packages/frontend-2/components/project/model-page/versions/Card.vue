<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="group rounded-md bg-foundation shadow transition hover:scale-[1.02] border-2 border-transparent hover:border-outline-2 hover:shadow-xl"
    @mouseleave="showActionsMenu = false"
  >
    <div @click="$emit('click', $event)">
      <div class="h-64 flex items-center justify-center relative">
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
            class="absolute top-0 p-2 flex space-x-1 items-center transition opacity-0 group-hover:opacity-100"
            :class="[hasAutomationStatus ? 'left-6' : 'left-0']"
          >
            <UserAvatar :user="version.authorUser" />
            <SourceAppBadge v-if="sourceApp" :source-app="sourceApp" />
          </div>
          <div
            v-if="version.commentThreadCount.totalCount !== 0"
            class="absolute top-0 right-0 p-2 flex items-center transition opacity-0 group-hover:opacity-100 h-8 bg-foundation border-2 border-primary-muted shadow-md justify-center rounded-tr-full rounded-tl-full rounded-br-full text-xs m-2"
          >
            <ChatBubbleLeftRightIcon class="w-4 h-4" />
            <span>{{ version.commentThreadCount.totalCount }}</span>
          </div>
        </template>
      </div>
      <div class="flex flex-col px-2 pt-1 pb-3">
        <div
          class="text-xs text-foreground-2 mr-1 opacity-0 truncate transition group-hover:opacity-100"
        >
          created
          <b>{{ createdAt }}</b>
        </div>
        <div class="w-full flex" @click.stop>
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
          <NuxtLink class="font-bold truncate" :href="viewerRoute">
            {{ message }}
          </NuxtLink>
          <div class="grow" />
          <ProjectModelPageVersionsCardActions
            v-if="!isPendingVersionFragment(version)"
            v-model:open="showActionsMenu"
            :project-id="projectId"
            :model-id="modelId"
            :version-id="version.id"
            :selection-disabled="selectionDisabled"
            @select="onSelect"
            @chosen="$emit('chosen', $event)"
          />
        </div>
      </div>
      <div
        v-if="!isPendingVersionFragment(version) && version.automationStatus"
        class="absolute top-1 left-0 p-2"
      >
        <ProjectPageModelsCardAutomationStatus
          :project-id="projectId"
          :model-or-version="{
            ...version,
            automationStatus: version.automationStatus
          }"
          :model-id="modelId"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  PendingFileUploadFragment,
  ProjectModelPageVersionsCardVersionFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { SpeckleViewer, SourceApps } from '@speckle/shared'
import { VersionActionTypes } from '~~/lib/projects/helpers/components'
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
    ...ModelCardAutomationStatus_Version
  }
`)

const emit = defineEmits<{
  (e: 'click', val: MouseEvent): void
  (e: 'select'): void
  (e: 'update:selected', val: boolean): void
  (e: 'chosen', val: VersionActionTypes): void
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

const hasAutomationStatus = computed(
  () => !isPendingVersionFragment(props.version) && props.version.automationStatus
)
const createdAt = computed(() => {
  const date = isPendingVersionFragment(props.version)
    ? props.version.convertedLastUpdate || props.version.uploadDate
    : props.version.createdAt
  return dayjs(date).from(dayjs())
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
