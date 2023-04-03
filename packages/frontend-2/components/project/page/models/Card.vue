<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div
    :class="containerClasses"
    @mouseleave=";(showActionsMenu = false), (hovered = false)"
    @mouseenter="hovered = true"
  >
    <!--
      Nested anchors are causing a hydration mismatch for some reason (template renders wrong in SSR), could be a Vue bug?
      TODO: Report it to Vue/Nuxt!
    -->
    <NuxtLink
      :href="defaultLinkDisabled ? undefined : modelRoute(project.id, model.id)"
      class="cursor-pointer"
      @click="$emit('click', $event)"
    >
      <div :class="`${height} flex items-center justify-center`">
        <div
          v-if="isPendingModelFragment(model)"
          class="px-4 w-full text-foreground-2 text-sm flex flex-col items-center space-y-1"
        >
          <template
            v-if="
              [
                FileUploadConvertedStatus.Queued,
                FileUploadConvertedStatus.Converting
              ].includes(model.convertedStatus)
            "
          >
            <span>Importing</span>
            <CommonLoadingBar loading class="max-w-[100px]" />
          </template>
          <template
            v-else-if="model.convertedStatus === FileUploadConvertedStatus.Completed"
          >
            <span class="inline-flex items-center space-x-1">
              <CheckCircleIcon class="h-4 w-4 text-success" />
              <span>Importing successful</span>
            </span>
          </template>
          <template v-else>
            <span class="inline-flex items-center space-x-1">
              <ExclamationTriangleIcon class="h-4 w-4 text-danger" />
              <span>Importing failed</span>
            </span>
            <span v-if="model.convertedMessage">
              {{ model.convertedMessage }}
            </span>
          </template>
        </div>
        <PreviewImage v-else-if="previewUrl" :preview-url="previewUrl" />
        <div
          v-else-if="pendingVersion"
          class="px-4 w-full text-foreground-2 text-sm flex flex-col items-center space-y-1"
        >
          <template
            v-if="
              [
                FileUploadConvertedStatus.Queued,
                FileUploadConvertedStatus.Converting
              ].includes(pendingVersion.convertedStatus)
            "
          >
            <span>Importing new version</span>
            <CommonLoadingBar loading class="max-w-[100px]" />
          </template>
          <template
            v-else-if="
              pendingVersion.convertedStatus === FileUploadConvertedStatus.Completed
            "
          >
            <span class="inline-flex items-center space-x-1">
              <CheckCircleIcon class="h-4 w-4 text-success" />
              <span>Version import successful</span>
            </span>
          </template>
          <template v-else>
            <span class="inline-flex items-center space-x-1">
              <ExclamationTriangleIcon class="h-4 w-4 text-danger" />
              <span>Version import failed</span>
            </span>
            <span v-if="pendingVersion.convertedMessage">
              {{ pendingVersion.convertedMessage }}
            </span>
          </template>
        </div>
        <div v-else class="h-full w-full p-4">
          <ProjectCardImportFileArea
            v-if="true"
            :project-id="project.id"
            :model-name="model.name"
            class="h-full w-full"
          />
          <div
            v-if="false"
            class="rounded-xl p-4 flex items-center h-full w-full border-dashed border-2 border-blue-500/10 text-foreground-2 text-xs text-center"
          >
            <div :class="`opacity-50 group-hover:opacity-100`">
              Use our
              <b>connectors</b>
              to send data to this model, or drag and drop a IFC/OBJ/STL file here.
            </div>
          </div>
        </div>
      </div>
      <div class="h-12 flex items-center px-2 py-1 space-x-1">
        <div class="flex-grow min-w-0">
          <div
            v-if="nameParts[0]"
            class="text-xs text-foreground-2 relative -mb-1 truncate"
          >
            {{ nameParts[0] }}
          </div>
          <div class="font-bold truncate text-foreground flex-shrink min-w-0">
            {{ nameParts[1] }}
          </div>
        </div>
        <div class="flex items-center">
          <div
            :class="`text-xs text-foreground-2 mr-1 truncate transition ${
              hovered ? 'w-auto' : 'w-0'
            }`"
          >
            updated
            <b>{{ updatedAt }}</b>
          </div>

          <FormButton
            v-if="finalShowVersions"
            v-tippy="'View Version Gallery'"
            rounded
            size="xs"
            :icon-left="ArrowPathRoundedSquareIcon"
            :to="modelVersionsRoute(project.id, model.id)"
            :class="`transition ${
              hovered ? 'inline-block opacity-100' : 'hidden opacity-0'
            }`"
            :disabled="versionCount === 0"
          >
            {{ versionCount }}
          </FormButton>
          <ProjectPageModelsActions
            v-if="showActions && !isPendingModelFragment(model)"
            v-model:open="showActionsMenu"
            :model="model"
            :project-id="project.id"
            :can-edit="canEdit"
            @click.stop.prevent
          />
        </div>
      </div>
      <div
        v-if="
          !isPendingModelFragment(model) && model.commentThreadCount.totalCount !== 0
        "
        :class="`absolute top-0 right-0 p-2 flex items-center transition border-2 border-primary-muted h-8 bg-foundation shadow-md justify-center rounded-tr-full rounded-tl-full rounded-br-full text-xs m-2 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`"
      >
        <ChatBubbleLeftRightIcon class="w-4 h-4" />
        <span>{{ model.commentThreadCount.totalCount }}</span>
      </div>
    </NuxtLink>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  PendingFileUploadFragment,
  ProjectPageLatestItemsModelItemFragment,
  ProjectPageModelsCardProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import {
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'
import { modelRoute, modelVersionsRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { isPendingModelFragment } from '~~/lib/projects/helpers/models'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'

/**
 * TODO:
 * - Pending version card fix updating
 * - Update model card list view as well
 * - Viewer no models view - wat do? (broken header)
 */

graphql(`
  fragment ProjectPageModelsCardProject on Project {
    id
    role
  }
`)

defineEmits<{
  (e: 'click', val: MouseEvent): void
}>()

const props = withDefaults(
  defineProps<{
    model: ProjectPageLatestItemsModelItemFragment | PendingFileUploadFragment
    project: ProjectPageModelsCardProjectFragment
    showVersions?: boolean
    showActions?: boolean
    disableDefaultLink?: boolean
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

const containerClasses = computed(() => {
  const classParts = [
    'group rounded-md bg-foundation shadow transition border-2 border-transparent'
  ]

  if (!isPendingModelFragment(props.model)) {
    classParts.push('hover:scale-[1.02] hover:border-outline-2 hover:shadow-xl')
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
  () => props.disableDefaultLink || isPendingModelFragment(props.model)
)

const updatedAt = computed(() => {
  const date = isPendingModelFragment(props.model)
    ? props.model.convertedLastUpdate || props.model.uploadDate
    : props.model.updatedAt
  return dayjs(date).from(dayjs())
})
const finalShowVersions = computed(
  () => props.showVersions && !isPendingModelFragment(props.model)
)
const canEdit = computed(() => canModifyModels(props.project))
const versionCount = computed(() =>
  isPendingModelFragment(props.model) ? 0 : props.model.versionCount.totalCount
)

const pendingVersion = computed(() =>
  isPendingModelFragment(props.model) ? null : props.model.pendingImportedVersions[0]
)
</script>
