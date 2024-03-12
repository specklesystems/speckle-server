<template>
  <div class="flex flex-col gap-12">
    <div
      class="p-4 bg-foundation shadow-sm flex flex-col gap-6 rounded-lg max-w-2xl mx-auto items-center"
    >
      <ProjectPageAutomationsScaleImpactImage />
      <div class="gap-2 flex flex-col text-center">
        <div class="h3 leading-10 text-fancy-gradient">Scale your digital impact</div>
        <div class="text-foreground normal">
          Speckle Automate empowers you to continuously monitor your published models,
          automatically ensuring project data standards, identifying potential design
          faults, and effortlessly creating delivery artifacts.
          <CommonTextLink :icon-right="ArrowTopRightOnSquareIcon">
            Learn more
          </CommonTextLink>
        </div>
      </div>
      <div>
        <FormButton :icon-left="PlusIcon" size="lg">New Automation</FormButton>
      </div>
    </div>
    <div class="flex flex-col">
      <div class="flex justify-between items-center">
        <h2 class="h5 font-bold">Featured Functions</h2>
        <FormButton
          :icon-left="ArrowTopRightOnSquareIcon"
          color="secondary"
          class="shrink-0"
        >
          Explore All Functions
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/vue/24/outline'
</script>
