<template>
  <div class="h-96 flex justify-center flex-col">
    <div class="w-full flex align-center justify-center animate-pulse">
      <img
        src="~~/assets/images/boxes/empty.png"
        alt="No search results found image"
        class="h-32"
      />
    </div>
    <h2 class="block font-normal leading-8 text-center p-2 h2">
      Create your first project!
    </h2>
    <h4 class="block font-normal leading-8 text-center p-2">
      Get started by creating your first project. Projects are places where your models
      and their versions live.
    </h4>
    <div class="text-center">
      <FormButton size="xl" class="shadow-lg" @click="$emit('create-project')">
        Create a project
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
defineEmits(['create-project'])
</script>
