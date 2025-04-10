<template>
  <CommonCard class="w-full bg-foundation">
    <div class="flex justify-between gap-4">
      <div class="flex gap-4">
        <WorkspaceAvatar :name="name" :logo="logo" size="xl" />
        <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
          <div class="flex flex-col flex-1">
            <h6 class="text-heading-sm">{{ name }}</h6>
            <p class="text-body-2xs text-foreground-2">
              {{ teamCount }}
              {{ teamCount === 1 ? 'member' : 'members' }}
            </p>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-y-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
defineProps<{
  logo: string
  name: string
  teamCount: number
}>()
</script>
