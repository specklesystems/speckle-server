<template>
  <ul class="flex flex-col">
    <SettingsUserEmailCard
      v-for="(email, i) in emailData"
      :key="`email-${i}`"
      :email-data="email"
      @deleted="$emit('deleted', email.id)"
      @make-primary="$emit('make-primary', email.id)"
    />
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  emailData: {
    email: string
    status: 'PRIMARY' | 'UNVERIFIED' | 'VERIFIED'
    id: number
  }
}>()

// TEMP
defineEmits<{
  (e: 'deleted', id: number): void
  (e: 'make-primary', id: number): void
}>()
</script>
