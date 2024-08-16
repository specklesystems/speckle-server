<template>
  <div>
    <FormButton
      :disabled="!isUserAdmin"
      full-width
      color="primary"
      @click="showWorkspaceCreateDialog = true"
    >
      New Workspace
    </FormButton>
    <WorkspaceCreateDialog v-model:open="showWorkspaceCreateDialog" />
  </div>
</template>

<script setup lang="ts">
const showWorkspaceCreateDialog = ref(false)

const { activeUser: user } = useActiveUser()

const isUserAdmin = computed(() => user.value?.role === 'server:admin')
</script>
