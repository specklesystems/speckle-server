<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    title="Invite people to workspace"
    :buttons="buttons"
  >
    <div>
      <FormTextInput
        name="search"
        size="lg"
        placeholder="Search by email or username..."
        :disabled="disabled"
        input-classes="pr-[85px] text-sm"
        color="foundation"
        label="Add people"
        show-label
        v-bind="bind"
        v-on="on"
      >
        <template #input-right>
          <div
            class="absolute inset-y-0 right-0 flex items-center pr-2"
            :class="disabled ? 'pointer-events-none' : ''"
          >
            <WorkspacePermissionSelect v-model="role" hide-remove />
          </div>
        </template>
      </FormTextInput>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Roles, type WorkspaceRoles } from '@speckle/shared'
import { useDebouncedTextInput, type LayoutDialogButton } from '@speckle/ui-components'

const open = defineModel<boolean>('open', { required: true })
const { on, bind, value: search } = useDebouncedTextInput()
const disabled = ref(false)
const role = ref<WorkspaceRoles>(Roles.Workspace.Member)

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Done',
    props: { color: 'primary' },
    onClick: () => {
      devLog('Save')
    }
  }
])

watch(search, devLog)
</script>
