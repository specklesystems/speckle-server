<template>
  <div class="h-96 flex justify-center flex-col">
    <div class="w-full flex align-center justify-center animate-pulse">
      <img
        src="~~/assets/images/boxes/empty.png"
        alt="No search results found image"
        class="h-32"
      />
    </div>
    <h2 class="block font-bold leading-8 text-center p-2 h3">
      Create your first project!
    </h2>
    <h4 class="block font-normal leading-8 text-center p-2">
      Projects are the place where your models and their versions live.
    </h4>
    <div class="text-center space-y-4">
      <FormButton size="xl" class="shadow-lg" @click="$emit('create-project')">
        Create a project
      </FormButton>
      <br />
      <FormButton text size="xs" to="/onboarding?force=true">
        Or go through the onboarding again
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
defineEmits(['create-project'])
</script>
