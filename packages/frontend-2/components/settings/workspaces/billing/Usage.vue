<template>
  <div class="border border-outline-3 rounded-lg divide-y divide-outline-3">
    <div
      v-if="isSelfServePlan && !statusIsCanceled"
      class="px-5 py-8 gap-y-6 flex flex-col sm:items-center sm:flex-row"
    >
      <div
        class="flex-1 flex flex-col gap-y-4 xl:w-[66%] lg:grid lg:grid-cols-2 lg:gap-x-4"
      >
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Editor seats</h3>
          <div class="flex items-center gap-x-2">
            <p class="text-body-xs text-foreground font-medium leading-none">
              {{ seats?.editors.assigned }}
            </p>
            <CommonBadge v-if="seats?.editors.available" rounded>
              {{ seats?.editors.available }} Unused
            </CommonBadge>
          </div>
        </div>
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Viewer seats</h3>
          <p class="text-body-xs text-foreground font-medium leading-none">
            {{ seats?.viewers.assigned }}
          </p>
        </div>
      </div>
      <div class="flex xl:w-[34%] xl:justify-end">
        <FormButton
          color="outline"
          @click="navigateTo(settingsWorkspaceRoutes.members.route(slug))"
        >
          Manage members
        </FormButton>
      </div>
    </div>
    <div class="px-5 py-8 gap-y-6 flex flex-col sm:items-center sm:flex-row">
      <div
        class="flex-1 flex flex-col gap-y-4 xl:w-[66%] lg:grid lg:grid-cols-2 lg:gap-x-4"
      >
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Projects</h3>
          <template v-if="limits?.projectCount">
            <p class="text-body-xs text-foreground font-medium pb-3 leading-none">
              {{ formatUsageText(projectCount, limits.projectCount, 'project') }}
            </p>
            <CommonProgressBar
              class="max-w-72 w-full"
              :current-value="projectCount"
              :max-value="limits.projectCount"
            />
          </template>
          <p v-else class="text-body-xs text-foreground font-medium leading-none">
            {{ projectCount }}
          </p>
        </div>
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Models</h3>
          <template v-if="limits?.modelCount">
            <p class="text-body-xs text-foreground font-medium pb-3 leading-none">
              {{ formatUsageText(modelCount, limits.modelCount, 'model') }}
            </p>
            <CommonProgressBar
              class="max-w-72 w-full"
              :current-value="modelCount"
              :max-value="limits?.modelCount"
            />
          </template>
          <p v-else class="text-body-xs text-foreground font-medium leading-none">
            {{ modelCount }}
          </p>
        </div>
      </div>
      <div class="flex xl:w-[34%] xl:justify-end">
        <FormButton
          color="outline"
          @click="navigateTo(settingsWorkspaceRoutes.projects.route(slug))"
        >
          Manage projects
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useWorkspaceUsage } from '~/lib/workspaces/composables/usage'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

const props = defineProps<{
  slug: string
}>()

const { projectCount, modelCount } = useWorkspaceUsage(props.slug)
const { limits } = useWorkspaceLimits({ slug: computed(() => props.slug) })
const { seats, statusIsCanceled, isSelfServePlan } = useWorkspacePlan(props.slug)

const formatUsageText = (current: number, max: number, type: string) => {
  return `${current} ${type}${current === 1 ? '' : 's'} used / ${max} included`
}
</script>
