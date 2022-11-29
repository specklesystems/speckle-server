<template>
  <div
    class="empty-state w-full min-h-[100px] bg-foundation-2 rounded-2xl py-20 xl:pt-28 xl:pb-40"
  >
    <h2 class="block h4 font-normal leading-8 text-center mb-16">
      Welcome to Speckle. What would you like to do?
    </h2>
    <div
      class="flex flex-col space-y-7 items-center md:flex-row md:space-x-7 md:space-y-0 justify-center md:items-stretch px-8"
    >
      <ProjectsDashboardEmptyStatePanel :icon="CubeIcon">
        <template #title>Explore your first project</template>
        <template #subtitle>
          Create your first Speckle project and learn the basics
        </template>
        <template #ctaText>
          <span class="space-x-2 inline-flex items-center">
            <ArrowLeftCircleIcon class="w-4 h-4" />
            <span>Explore</span>
          </span>
        </template>
      </ProjectsDashboardEmptyStatePanel>
      <ProjectsDashboardEmptyStatePanel
        :icon="CloudArrowUpIcon"
        :to="DownloadManagerRoute"
      >
        <template #title>Already have a 3D model?</template>
        <template #subtitle>
          Install connectors from Revit, Rhino, AutoCAD, Blender and many others!
        </template>
        <template #ctaText>
          <span class="space-x-2 inline-flex items-center">
            <CloudArrowDownIcon class="w-4 h-4" />
            <span>Download manager</span>
          </span>
        </template>
      </ProjectsDashboardEmptyStatePanel>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowLeftCircleIcon
} from '@heroicons/vue/24/solid'
import { DownloadManagerRoute } from '~~/lib/common/helpers/route'
</script>
<style scoped>
.empty-state {
  /** dashed border, source: https://kovart.github.io/dashed-border-generator/ */
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='rgb(59 130 246 / 50%)' stroke-width='2' stroke-dasharray='14' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
}
</style>
