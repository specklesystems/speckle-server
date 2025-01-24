<template>
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
