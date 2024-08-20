<template>
  <div class="h-80 flex justify-center flex-col text-center">
    <div class="w-full flex align-center justify-center">
      <img
        src="~~/assets/images/boxes/empty.png"
        alt="No search results found image"
        class="h-24"
      />
    </div>
    <h2 class="text-heading mt-2">
      {{ isGuest ? 'No projects found!' : 'Create your first project!' }}
    </h2>
    <h4 class="text-body-xs mb-4 max-w-xs mx-auto">
      Projects are the place where your models and their versions live.
    </h4>
    <div class="flex flex-col items-center gap-2">
      <FormButton v-if="!isGuest" class="shadow-lg" @click="$emit('create-project')">
        Create a project
      </FormButton>
      <FormButton text size="sm" to="/onboarding?force=true">
        {{
          isGuest
            ? 'Go through the onboarding again?'
            : 'Or go through the onboarding again'
        }}
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

defineEmits(['create-project'])

const { isGuest } = useActiveUser()
</script>
