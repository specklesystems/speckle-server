<template>
  <div class="flex flex-col">
    <h2 class="text-heading-xl mb-4">Automation</h2>
    <div class="grid gap-4 grid-cols-12">
      <!-- <ProjectPageMoreActionsCard :class="cardWidthClasses">
        <template #title>Globals</template>
        <template #description>
          Global variables can hold various information that's useful across the
          project.
        </template>
      </ProjectPageMoreActionsCard> -->
      <ProjectPageMoreActionsCard :class="cardWidthClasses">
        <template #title>Webhooks</template>
        <template #description>
          If you need to use webhooks, ask the project's owner to grant you ownership.
        </template>
      </ProjectPageMoreActionsCard>
    </div>
  </div>
</template>
<script setup lang="ts">
const cardWidthClasses = computed(
  () => 'col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3'
)
</script>
