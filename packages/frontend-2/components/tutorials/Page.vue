<template>
  <div>
    <div class="flex flex-col gap-y-6">
      <section class="flex items-center gap-2">
        <div class="flex flex-col gap-2 flex-1">
          <div class="flex items-center gap-2">
            <IconTutorials class="size-4" />
            <h1 class="text-heading-lg">Tutorials</h1>
          </div>
          <p class="text-body-sm text-foreground-2">
            Get started with Speckle with step-by-step instructions for all skill
            levels.
          </p>
        </div>
      </section>
      <section class="flex gap-4 flex-col">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <TutorialsCard
            v-for="tutorial in tutorialItems"
            :key="tutorial.title"
            :tutorial-item="tutorial"
            source="tutorials"
          />
        </div>
        <div class="flex justify-center mt-4">
          <FormButton
            label="View all tutorials"
            to="https://www.speckle.systems/tutorials"
            target="_blank"
            color="outline"
            external
            @click="trackViewAllClick"
          >
            View all tutorials
          </FormButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tutorialItems } from '~/lib/dashboard/helpers/tutorials'
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

const trackViewAllClick = () => {
  mixpanel.track('View All Tutorials Button Clicked')
}
</script>
