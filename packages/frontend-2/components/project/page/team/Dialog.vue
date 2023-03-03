<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div class="flex flex-col text-foreground space-y-4">
      <div class="h4 font-bold">Manage your team</div>
      <div class="flex flex-col">
        <FormTextInput
          v-model="search"
          name="search"
          size="lg"
          placeholder="username or email"
          input-classes="pr-20"
        >
          <template #input-right>
            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
              <ProjectPageTeamPermissionSelect v-model="role" />
            </div>
          </template>
        </FormTextInput>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { ProjectRole } from '~~/lib/common/generated/gql/graphql'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const search = ref('')
const role = ref(ProjectRole.Contributor)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
