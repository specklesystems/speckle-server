<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="group rounded-md bg-foundation shadow transition hover:scale-[1.02] border-2 border-transparent hover:border-outline-2 hover:shadow-xl"
    @mouseleave="showActionsMenu = false"
  >
    <!--
      Nested anchors are causing a hydration mismatch for some reason (template renders wrong in SSR), could be a Vue bug?
      TODO: Report it to Vue/Nuxt!
    -->
    <NuxtLink
      :href="viewerRoute"
      class="cursor-pointer"
      @click="$emit('click', $event)"
    >
      <div class="h-64 flex items-center justify-center relative">
        <PreviewImage :preview-url="version.previewUrl" />
        <div
          class="absolute top-0 left-0 p-2 flex space-x-1 items-center transition opacity-0 group-hover:opacity-100"
        >
          <UserAvatar :user="version.authorUser" />
          <SourceAppBadge v-if="sourceApp" :source-app="sourceApp" />
        </div>
        <div
          class="absolute top-0 right-0 p-2 flex items-center space-x-1 transition opacity-0 group-hover:opacity-100"
        >
          <ChatBubbleLeftEllipsisIcon class="h-4 w-4" />
          <span>{{ version.commentThreadCount }}</span>
        </div>
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
            v-if="selectable"
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
          <div class="font-bold truncate grow">
            {{ version.message || 'no message' }}
          </div>
          <ProjectModelPageVersionsCardActions
            v-model:open="showActionsMenu"
            :project-id="projectId"
            :model-id="modelId"
            :version-id="version.id"
            @select="onSelect"
            @chosen="$emit('chosen', $event)"
          />
        </div>
      </div>
    </NuxtLink>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { ProjectModelPageVersionsCardVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { SpeckleViewer, SourceApps } from '@speckle/shared'
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/vue/24/solid'
import { VersionActionTypes } from '~~/lib/projects/helpers/components'

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
    commentThreadCount
    ...ProjectModelPageDialogDeleteVersion
    ...ProjectModelPageDialogMoveToVersion
  }
`)

const emit = defineEmits<{
  (e: 'click', val: MouseEvent): void
  (e: 'select'): void
  (e: 'update:selected', val: boolean): void
  (e: 'chosen', val: VersionActionTypes): void
}>()

const props = defineProps<{
  version: ProjectModelPageVersionsCardVersionFragment
  projectId: string
  modelId: string
  selectable?: boolean
  selected?: boolean
  selectionDisabled?: boolean
}>()

const showActionsMenu = ref(false)

const createdAt = computed(() => dayjs(props.version.createdAt).from(dayjs()))
const viewerRoute = computed(() => {
  const resourceIdString = SpeckleViewer.ViewerRoute.resourceBuilder()
    .addModel(props.modelId, props.version.id)
    .toString()
  return modelRoute(props.projectId, resourceIdString)
})

const sourceApp = computed(() =>
  SourceApps.find((a) => props.version.sourceApplication?.includes(a.searchKey))
)

const checkboxModel = computed({
  get: () => (props.selectable && props.selected ? true : undefined),
  set: (newVal) => emit('update:selected', !!newVal)
})

const onSelect = () => {
  emit('select')
}
</script>
