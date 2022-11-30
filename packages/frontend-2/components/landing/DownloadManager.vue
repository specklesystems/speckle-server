<template>
  <div class="bg-primary max-w-full overflow-x-hidden">
    <div class="layout-container pt-14">
      <div class="grid gap-0 sm:gap-8 grid-cols-12">
        <div
          :class="[
            'flex flex-col text-center text-foreground-on-primary',
            'col-span-12',
            'lg:col-start-2 lg:col-span-10',
            'xl:col-start-3 xl:col-span-8'
          ]"
        >
          <h1 class="h1 font-semibold leading-10 mb-5">Manager for Speckle</h1>
          <h2 class="h6 font-normal leading-6 mb-8">
            Manage your Connectors and Accounts with ease! Manager for Speckle is the
            only tool you'll need to install and update Connectors and link your
            Accounts.
          </h2>
          <div class="w-full aspect-video relative">
            <div class="w-full h-full bg-foreground rounded-2xl z-10 relative">
              <!-- Video goes here -->
            </div>
            <div
              class="absolute bg-foundation-page left-[-99999px] right-[-99999px] bottom-0 top-[50%] z-0"
            />
          </div>
          <div class="bg-foundation-page pt-8 relative">
            <div class="relative z-10">
              <div>
                <CommonStepsNumber
                  :steps="steps"
                  :model-value="-1"
                  :go-vertical-below="TailwindBreakpoints.md"
                  non-interactive
                  class="mb-8 steps"
                />
              </div>
              <div class="flex justify-center mb-8">
                <FormButton size="xl">Create new project</FormButton>
              </div>
            </div>
            <div
              class="absolute bg-foundation-page left-[-99999px] right-[-99999px] top-0 bottom-0 z-0"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { NumberStepType } from '~~/lib/common/helpers/components'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

const steps: NumberStepType[] = [
  { name: 'Install Manager and log in' },
  { name: 'Find and connect your tool' },
  { name: 'Send and receive 3D data' }
]
</script>
<style scoped>
.steps :deep(*) {
  @apply text-foreground-2 border-foreground-2 !important;
}
</style>
