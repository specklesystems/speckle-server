<template>
  <div class="flex flex-col">
    <h6
      v-if="title"
      class="font-bold select-none font-medium text-foreground-2 text-sm mb-1"
    >
      {{ title }}
    </h6>
    <div v-for="(item, itemIndex) in items" :key="itemIndex">
      <button
        class="group flex items-center justify-between gap-2 shrink-0 text-sm select-none rounded-md w-full hover:bg-primary-muted p-2"
      >
        <div class="flex items-center gap-1.5">
          <div class="w-6 h-6 flex items-center justify-center">
            <slot :name="item.id" />
          </div>
          {{ item.label }}
        </div>
        <div
          v-if="item.tag"
          class="text-xs uppercase bg-primary-muted py-0.5 px-2 rounded-full font-medium text-primary-focus group-hover:bg-white"
        >
          {{ item.tag }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MenuItem {
  label: string
  id: string
  tag?: string
}

defineProps<{
  title?: string
  items: MenuItem[]
}>()
</script>
