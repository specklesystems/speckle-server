<template>
  <div class="grid gap-y-2 mt-">
    <p class="caption text-foreground-2">Pending invites</p>
    <div
      class="flex items-center justify-between rounded-xl text-white pl-4 pr-2 py-2 shadow hover:shadow-lg transition bg-primary"
    >
      <div class="text-sm">Check out the Design System.</div>
      <div>
        <FormButton class="ml-2" to="/designsystem">Take me there</FormButton>
      </div>
    </div>
    <template v-for="(notification, i) in notifications" :key="i">
      <div
        class="flex items-center justify-between rounded-xl bg-foundation text-foreground pl-4 pr-2 py-2 shadow hover:shadow-lg transition"
      >
        <div class="text-sm">
          {{ notification.message }}
        </div>
        <div>
          <FormButton
            v-for="(action, index) in notification.actions"
            :key="index"
            class="ml-2"
            to="/designsystem"
            :type="index == 0 ? 'standard' : 'outline'"
          >
            {{ action }}
          </FormButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const notifications = [
  {
    message: 'Dimitrie invites you to Super Something Pants Project.',
    actions: ['Accept', 'X']
  },
  {
    message: 'Fabians wants to share  with you.',
    actions: ['Accept', 'X']
  } /* ,
  {
    message: 'Fabians requests access to Pasta Project',
    actions: ['Grant Access', 'View Project', 'Ignore']
  } */
]
</script>
