<template>
  <div>
    <HeaderEmpty v-if="emptyHeader">
      <template #header-left>
        <slot name="header-left" />
      </template>
      <template #header-right>
        <slot name="header-right" />
      </template>
    </HeaderEmpty>
    <HeaderNavBar v-else />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0"></div>

      <div class="relative flex h-[calc(100dvh-3rem)]">
        <main class="w-full h-full overflow-y-auto simple-scrollbar pt-4 lg:pt-6 pb-16">
          <div class="container mx-auto px-6 md:px-8">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  emptyHeader?: boolean
}>()
</script>
