<template>
  <div class="flex flex-col gap-12">
    <WorkspacesPromoBanner
      :is-admin="isAdmin"
      @create="showWorkspaceCreateDialog = true"
    />

    <section>
      <div class="flex justify-between mb-2">
        <h4 class="text-foreground-2 text-heading-sm">In a nutshell</h4>
        <FormButton :disabled="!isAdmin" @click="showWorkspaceCreateDialog = true">
          Create workspace
        </FormButton>
      </div>

      <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CommonCard
          title="A space for your entire team"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
        >
          <template #icon>icon</template>
        </CommonCard>

        <CommonCard
          title="All your projects in one place"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
        >
          <template #icon>icon</template>
        </CommonCard>

        <CommonCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
        >
          <template #icon>icon</template>
        </CommonCard>

        <CommonCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
        >
          <template #icon>icon</template>
        </CommonCard>

        <CommonCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
        >
          <template #icon>icon</template>
        </CommonCard>
        <CommonCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
        >
          <template #icon>icon</template>
        </CommonCard>
      </div>
    </section>
    <WorkspaceCreateDialog
      v-model:open="showWorkspaceCreateDialog"
      navigate-on-success
    />
  </div>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'

const showWorkspaceCreateDialog = ref(false)

const { activeUser: user } = useActiveUser()

const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)
</script>
