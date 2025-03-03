<script setup lang="ts">
import { NavigationMenuLink } from 'reka-ui'

const props = defineProps({
  title: String
})
</script>

<template>
  <li>
    <NavigationMenuLink as-child>
      <a
        v-bind="$attrs"
        class="block select-none p-3 text-sm leading-none no-underline outline-none rounded-md transition-colors group"
      >
        <div class="text-body-sm font-medium mb-2 group-hover:text-primary">
          {{ props.title }}
        </div>
        <p class="mt-2 leading-[1.4] text-body-xs text-foreground-2 line-clamp-2">
          <slot />
        </p>
      </a>
    </NavigationMenuLink>
  </li>
</template>
