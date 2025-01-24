<template>
  <div>
    <nav class="fixed z-40 top-0 h-12 bg-foundation border-b border-outline-2">
      <div
        class="flex gap-8 items-center justify-between h-full w-screen py-4 px-3 sm:px-4"
      >
        <div>
          <HeaderLogoBlock
            v-if="showLogo"
            :active="false"
            :to="homeRoute"
            :no-link="!logoLink"
            class="hidden lg:flex lg:min-w-40"
          />
        </div>
        <div>
          <slot name="header-actions" />
        </div>
      </div>
    </nav>
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
import { homeRoute } from '~/lib/common/helpers/route'

withDefaults(
  defineProps<{
    showLogo: boolean
    logoLink: boolean
  }>(),
  {
    logoLink: true
  }
)
</script>
