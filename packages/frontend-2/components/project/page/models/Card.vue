<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    v-keyboard-clickable
    :class="containerClasses"
    @click="onCardClick"
    @mouseleave=";(showActionsMenu = false), (hovered = false)"
    @mouseenter="hovered = true"
  >
    <div class="relative p-2 h-full flex flex-col">
      <NuxtLink
        v-if="!defaultLinkDisabled"
        :to="modelRoute(projectId, model.id)"
        class="absolute z-10 inset-0"
      />
      <div class="relative z-40 flex justify-between items-center h-10">
        <NuxtLink
          :to="!defaultLinkDisabled ? modelRoute(projectId, model.id) : undefined"
          class="truncate"
        >
          <div class="px-1 select-none w-full">
            <div
              v-if="nameParts[0]"
              class="text-body-2xs text-foreground-2 relative truncate"
            >
              {{ nameParts[0] }}
            </div>
            <div
              class="text-body-xs font-medium truncate text-foreground flex-shrink min-w-0"
            >
              {{ nameParts[1] }}
            </div>
          </div>
        </NuxtLink>
        <ProjectPageModelsActions
          v-if="project && showActions && !isPendingModelFragment(model)"
          v-model:open="showActionsMenu"
          :model="model"
          :project="project"
          :can-edit="canEdit"
          @click.stop.prevent
          @upload-version="triggerVersionUpload"
        />
      </div>
      <div class="relative flex items-center justify-center my-1 flex-1">
        <div
          v-if="
            isAutomateModuleEnabled &&
            !isPendingModelFragment(model) &&
            model.automationsStatus
          "
          class="z-30 absolute top-0 left-0"
        >
          <AutomateRunsTriggerStatus
            :project-id="projectId"
            :status="model.automationsStatus"
            :model-id="model.id"
          />
        </div>
        <ProjectPendingFileImportStatus
          v-if="isPendingModelFragment(model)"
          :upload="model"
          class="px-4 w-full h-full"
        />
        <ProjectPendingFileImportStatus
          v-else-if="pendingVersion"
          :upload="pendingVersion"
          type="subversion"
          class="px-4 w-full text-foreground-2 text-sm flex flex-col items-center space-y-1"
        />
        <template v-else-if="previewUrl">
          <NuxtLink
            :to="!defaultLinkDisabled ? modelRoute(projectId, model.id) : undefined"
            class="relative z-20 bg-foundation-page w-full h-48 rounded-xl border border-outline-2"
          >
            <PreviewImage :preview-url="previewUrl" />
          </NuxtLink>
        </template>
        <div
          v-if="!isPendingModelFragment(model)"
          v-show="!previewUrl && !pendingVersion"
          class="h-48 w-full relative z-30"
        >
          <ProjectCardImportFileArea
            ref="importArea"
            :project-id="projectId"
            :model-name="model.name"
            class="w-full h-full"
          />
        </div>
      </div>
      <div class="relative z-20 flex justify-between items-center w-full h-8 pl-2">
        <ProjectPageModelsCardUpdatedTime
          class="text-body-3xs text-foreground-2"
          :updated-at="updatedAtFullDate"
        />
        <div class="flex items-center gap-1">
          <div
            v-if="!isPendingModelFragment(model)"
            class="flex items-center gap-1 !text-foreground-2"
            :to="modelVersionsRoute(projectId, model.id)"
          >
            <IconDiscussions class="h-4 w-4" />
            <span class="text-body-2xs font-medium">
              {{ model.commentThreadCount.totalCount }}
            </span>
          </div>
          <FormButton
            v-tippy="'View Versions'"
            color="subtle"
            size="sm"
            class="flex items-center gap-1 !text-foreground-2"
            @click.stop="router.push(modelVersionsRoute(projectId, model.id))"
          >
            <IconVersions class="h-4 w-4" />
            {{ versionCount }}
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type {
  PendingFileUploadFragment,
  ProjectPageLatestItemsModelItemFragment,
  ProjectPageModelsCardProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelVersionsRoute, modelRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { isPendingModelFragment } from '~~/lib/projects/helpers/models'
import type { Nullable, Optional } from '@speckle/shared'

graphql(`
  fragment ProjectPageModelsCardProject on Project {
    id
    role
    visibility
    ...ProjectPageModelsActions_Project
  }
`)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent | KeyboardEvent): void
}>()

const props = withDefaults(
  defineProps<{
    projectId: string
    model: ProjectPageLatestItemsModelItemFragment | PendingFileUploadFragment
    project: Optional<ProjectPageModelsCardProjectFragment>
    showVersions?: boolean
    showActions?: boolean
    disableDefaultLink?: boolean
  }>(),
  {
    showVersions: true,
    showActions: true
  }
)

// TODO: Get rid of this, its not reactive. Is it even necessary?
provide('projectId', props.projectId)

const router = useRouter()
const isAutomateModuleEnabled = useIsAutomateModuleEnabled()

const importArea = ref(
  null as Nullable<{
    triggerPicker: () => void
  }>
)
const showActionsMenu = ref(false)
const hovered = ref(false)

const containerClasses = computed(() => {
  const classParts = [
    'group rounded-xl bg-foundation border border-outline-3 hover:border-outline-5 w-full z-[0]'
  ]

  if (versionCount.value > 0) {
    classParts.push('cursor-pointer')
  }

  return classParts.join(' ')
})
const nameParts = computed(() => {
  const model = props.model
  const modelName = isPendingModelFragment(model) ? model.modelName : model.name
  const splitName = modelName.split('/')
  if (splitName.length === 1) return [null, modelName]

  const displayName = splitName.pop()
  return [splitName.join('/') + '/', displayName]
})

const previewUrl = computed(() =>
  isPendingModelFragment(props.model) ? null : props.model.previewUrl
)
const defaultLinkDisabled = computed(
  () => props.disableDefaultLink || versionCount.value < 1
)

const updatedAtFullDate = computed(() => {
  return isPendingModelFragment(props.model)
    ? props.model.convertedLastUpdate || props.model.uploadDate
    : props.model.updatedAt
})

const canEdit = computed(() => (props.project ? canModifyModels(props.project) : false))
const versionCount = computed(() => {
  return isPendingModelFragment(props.model) ? 0 : props.model.versionCount.totalCount
})

const pendingVersion = computed(() => {
  return isPendingModelFragment(props.model)
    ? null
    : props.model.pendingImportedVersions[0]
})

const onCardClick = (event: KeyboardEvent | MouseEvent) => {
  if (
    !previewUrl.value &&
    !pendingVersion.value &&
    !isPendingModelFragment(props.model)
  ) {
    return
  }
  emit('click', event)
}

const triggerVersionUpload = () => {
  importArea.value?.triggerPicker()
}
</script>
