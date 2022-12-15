<template>
  <div class="flex flex-col">
    <h2 class="h3 font-bold mb-4">More actions</h2>
    <div class="grid gap-4 grid-cols-12">
      <ProjectPageMoreActionsCard class="col-span-3">
        <template #title>Globals</template>
        <template #description>
          Global variables can hold various information that's useful across the
          project.
        </template>
      </ProjectPageMoreActionsCard>
      <ProjectPageMoreActionsCard class="col-span-3">
        <template #title>Webhooks</template>
        <template #description>
          If you need to use webhooks, ask the stream's owner to grant you ownership.
        </template>
      </ProjectPageMoreActionsCard>
    </div>
  </div>
</template>
