<template>
  <div class="pt-4 flex items-center justify-between">
    <Portal to="navigation">
      <HeaderNavLink
        :to="automationFunctionsRoute"
        :name="'Automate Functions'"
      ></HeaderNavLink>
    </Portal>

    <h1 class="h3 font-bold">Functions</h1>
    <div class="flex gap-2">
      <FormTextInput
        name="search"
        placeholder="Search Functions"
        show-clear
        :model-value="bind.modelValue.value"
        color="foundation"
        v-on="on"
      />
      <FormButton :icon-left="PlusIcon">New Function</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/outline'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { automationFunctionsRoute } from '~/lib/common/helpers/route'

// TODO: New function dialog

const search = defineModel<string>('search')
const { on, bind } = useDebouncedTextInput({ model: search })
</script>
