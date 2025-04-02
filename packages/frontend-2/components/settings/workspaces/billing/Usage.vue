<!-- TODO: Update these with real limits once available -->
<template>
  <div class="border border-outline-3 rounded-lg divide-y divide-outline-3">
    <div class="px-5 py-8 gap-y-6 flex flex-col sm:items-center sm:flex-row">
      <div
        class="flex-1 flex flex-col gap-y-4 xl:w-[66%] lg:grid lg:grid-cols-2 lg:gap-x-4"
      >
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Editor seats</h3>
          <div class="flex items-center gap-x-2">
            <p class="text-body-xs text-foreground font-medium leading-none">4</p>
            <CommonBadge rounded>2 unused</CommonBadge>
          </div>
        </div>
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Viewer seats</h3>
          <p class="text-body-xs text-foreground font-medium leading-none">4</p>
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
          <p class="text-body-xs text-foreground font-medium pb-3 leading-none">
            {{ formatUsageText(10, 100, 'project') }}
          </p>
          <CommonProgressBar
            class="max-w-72 w-full"
            :current-value="10"
            :max-value="100"
          />
        </div>
        <div>
          <h3 class="text-body-xs text-foreground-2 pb-2">Models</h3>
          <p class="text-body-xs text-foreground font-medium pb-3 leading-none">
            {{ formatUsageText(10, 100, 'model') }}
          </p>
          <CommonProgressBar
            class="max-w-72 w-full"
            :current-value="10"
            :max-value="100"
          />
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

defineProps<{
  slug: string
}>()

const formatUsageText = (current: number, max: number, type: string) => {
  return `${current} ${type}${current === 1 ? '' : 's'} used / ${max} included`
}
</script>
