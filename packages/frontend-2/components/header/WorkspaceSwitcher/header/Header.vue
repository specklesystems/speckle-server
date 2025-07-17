<template>
  <div class="p-2 pb-3 flex flex-col gap-y-4">
    <div class="flex gap-x-3 items-center">
      <MenuItem>
        <NuxtLink :to="to || ''">
          <WorkspaceAvatar
            :name="name || ''"
            :logo="logo"
            size="lg"
            class="flex-shrink-0"
          />
        </NuxtLink>
      </MenuItem>
      <div class="flex flex-col space-between min-w-0">
        <p class="text-body-xs text-foreground truncate">
          {{ name }}
        </p>
        <slot />
      </div>
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { MenuItem } from '@headlessui/vue'

defineProps<{
  name: MaybeNullOrUndefined<string>
  logo: MaybeNullOrUndefined<string>
  to: MaybeNullOrUndefined<string>
}>()
</script>
