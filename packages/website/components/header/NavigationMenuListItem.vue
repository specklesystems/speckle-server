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
        class="block select-none p-3 text-sm leading-none no-underline outline-none rounded-md transition-colors hover:bg-highlight-1"
      >
        <div class="text-body-sm font-medium mb-2">
          {{ props.title }}
        </div>
        <p class="my-0 leading-[1.4] text-body-xs text-foreground-2">
          <slot />
        </p>
      </a>
    </NavigationMenuLink>
  </li>
</template>
