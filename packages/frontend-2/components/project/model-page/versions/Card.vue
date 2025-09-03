<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    class="group rounded-xl bg-foundation border border-outline-3"
    :class="isLimited ? '' : 'hover:border-outline-5'"
  >
    <div class="flex flex-col p-3 pt-2" @click="$emit('click', $event)">
      <div class="flex justify-between items-center">
        <NuxtLink
          class="text-body-xs font-medium truncate text-foreground pl-1 select-none"
          :href="isLimited ? undefined : viewerRoute"
        >
          {{ message }}
        </NuxtLink>
        <ProjectModelPageVersionsCardActions
          v-if="!isPendingVersionFragment(version)"
          v-model:open="showActionsMenu"
          :project-id="project.id"
          :model-id="modelId"
          :version-id="version.id"
          :selection-disabled="!isSelectionDisabled.authorized"
          :selection-disabled-message="isSelectionDisabled.message"
          @select="onSelect"
          @chosen="$emit('chosen', $event)"
          @embed="$emit('embed')"
        />
      </div>
      <div>
        <div
          class="h-48 flex items-center justify-center relative bg-foundation-page border border-outline-3 mb-3 mt-2 rounded-xl"
        >
          <ProjectPendingFileImportStatus
            v-if="isPendingVersionFragment(version)"
            :upload="version"
            class="px-4 w-full text-foreground-2 text-sm flex flex-col items-center space-y-1"
          />
          <template v-else>
            <NuxtLink v-if="!isLimited" :href="viewerRoute" class="h-full w-full">
              <PreviewImage :preview-url="version.previewUrl" />
            </NuxtLink>
            <div
              v-else
              class="h-full w-full diagonal-stripes flex items-center justify-center p-2"
            >
              <ViewerResourcesLimitAlert
                class="!bg-foundation !text-foreground-2"
                limit-type="version"
                :project="project"
              />
            </div>
            <div
              v-if="
                isAutomateModuleEnabled &&
                !isPendingVersionFragment(version) &&
                version.automationsStatus
              "
              class="absolute top-1 left-0 p-2"
            >
              <AutomateRunsTriggerStatus
                :project-id="project.id"
                :status="version.automationsStatus"
                :model-id="modelId"
                :version-id="version.id"
              />
            </div>
          </template>
        </div>
        <div class="flex items-center">
          <FormCheckbox
            v-if="isSelectable"
            v-model="checkboxModel"
            v-tippy="
              !isSelectionDisabled.authorized ? isSelectionDisabled.message : undefined
            "
            name="selected"
            hide-label
            :value="true"
            :disabled="!isSelectionDisabled.authorized"
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
            <div
              v-if="version.commentThreadCount.totalCount !== 0"
              class="text-body-xs text-foreground flex items-center space-x-1 pl-2"
            >
              <IconDiscussions class="w-4 h-4" />
              <span>{{ version?.commentThreadCount.totalCount }}</span>
            </div>
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
  FullPermissionCheckResultFragment,
  PendingFileUploadFragment,
  ProjectModelPageVersionsCard_ProjectFragment,
  ProjectModelPageVersionsCardVersionFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { SpeckleViewer, SourceApps } from '@speckle/shared'
import type { VersionActionTypes } from '~~/lib/projects/helpers/components'
import { isPendingVersionFragment } from '~~/lib/projects/helpers/models'

graphql(`
  fragment ProjectModelPageVersionsCard_Project on Project {
    id
    workspace {
      id
      slug
    }
    ...ViewerResourcesLimitAlert_Project
  }
`)

graphql(`
  fragment ProjectModelPageVersionsCardVersion on Version {
    id
    message
    authorUser {
      ...LimitedUserAvatar
    }
    createdAt
    previewUrl
    referencedObject
    sourceApplication
    commentThreadCount: commentThreads(limit: 0) {
      totalCount
    }
    ...ProjectModelPageDialogDeleteVersion
    ...ProjectModelPageDialogMoveToVersion
    automationsStatus {
      ...AutomateRunsTriggerStatus_TriggeredAutomationsStatus
    }
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
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
  project: ProjectModelPageVersionsCard_ProjectFragment
  modelId: string
  selectable?: boolean
  selected?: boolean
}>()

const { formattedRelativeDate, formattedFullDate } = useDateFormatters()
const isAutomateModuleEnabled = useIsAutomateModuleEnabled()

const showActionsMenu = ref(false)

// Check if the version is limited due to plan restrictions
const isLimited = computed(() => {
  if (isPendingVersionFragment(props.version)) return false

  // If it's a regular version, check if referencedObject is null (indicating plan limits)
  return props.version.referencedObject === null
})

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
  return modelRoute(props.project.id, resourceIdString)
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
const isSelectionDisabled = computed(
  (): FullPermissionCheckResultFragment =>
    isPendingVersionFragment(props.version)
      ? {
          authorized: false,
          message: 'You cannot select a pending version',
          code: 'PENDING_VERSION_ERROR'
        }
      : props.version.permissions.canUpdate
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
