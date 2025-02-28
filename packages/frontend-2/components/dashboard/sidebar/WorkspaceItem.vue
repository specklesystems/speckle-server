<template>
  <div class="flex items-center">
    <div class="w-6">
      <IconCheck v-if="isActive" class="w-4 h-4 mx-1 text-foreground" />
    </div>
    <MenuItem>
      <NuxtLink class="flex-1" @click="$emit('onClick')">
        <LayoutSidebarMenuGroupItem
          :label="name"
          :tag="tag"
          color-classes="bg-foundation-2 text-foreground-2"
        >
          <template #icon>
            <WorkspaceAvatar :name="name" :logo="logo" size="sm" />
          </template>
        </LayoutSidebarMenuGroupItem>
      </NuxtLink>
    </MenuItem>
  </div>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineEmits(['onClick'])

defineProps<{
  isActive: boolean
  name: string
  logo?: MaybeNullOrUndefined<string>
  tag?: string
}>()
</script>
