<template>
  <div
    class="relative w-full bg-foundation-page border border-outline-2 rounded-lg overflow-hidden p-12"
  >
    <div class="absolute inset-0">
      <NuxtImg
        src="workspaces.png"
        alt="Introducing workspaces"
        class="absolute top-0 right-0 w-full sm:w-7/12 h-full object-cover"
      />

      <div
        class="absolute top-0 right-0 h-full w-7/12 bg-gradient-to-r from-foundation-page"
      >
        <div class="h-full w-64 bg-gradient-to-r from-foundation-page" />
      </div>
    </div>

    <div class="relative z-10 text-foreground max-w-lg">
      <div class="flex gap-2 items-center">
        <h3 class="text-heading-lg">Introducing workspaces</h3>
        <CommonBadge rounded class="">NEW</CommonBadge>
      </div>
      <p class="text-body-sm mt-4">
        Talented teams around the world use Workspaces for seamless project delivery.
        Control and easier collaboration with a shared space for your team and data.
      </p>
      <div class="flex mt-6 gap-2">
        <FormButton :disabled="!isAdmin" color="outline" @click="$emit('create')">
          Create workspace
        </FormButton>
        <FormButton color="subtle">Learn more</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  isAdmin: boolean
}>()

defineEmits<{
  (e: 'create'): void
}>()
</script>
