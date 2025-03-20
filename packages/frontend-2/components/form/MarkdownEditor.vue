<template>
  <div class="flex flex-col space-y-2">
    <div class="text-body-xs font-medium text-foreground flex">
      <span class="flex-1">{{ label }}</span>
      <CommonTextLink size="sm" @click="toggleEditor">
        {{ isEditing ? 'Preview' : 'Editor' }}
      </CommonTextLink>
    </div>
    <FormTextArea
      v-show="isEditing"
      v-model="value"
      textarea-classes="font-mono"
      :name="name"
      color="foundation"
      :label="label"
      :show-label="false"
      :placeholder="placeholder"
      :help="help"
      :rules="typesafeRules"
      :rows="rows"
    />
    <LayoutPanel
      v-show="!isEditing"
      panel-classes="simple-scrollbar !overflow-auto max-h-64"
    >
      <CommonProseMarkdownDescription :markdown="value" />
    </LayoutPanel>
    <p class="text-body-xs text-foreground-2">
      This field supports markdown.
      <NuxtLink
        href="https://www.markdownguide.org/basic-syntax/"
        class="underline"
        external
      >
        Click here
      </NuxtLink>
      for more info.
    </p>
  </div>
</template>
<script setup lang="ts">
import { type RuleExpression, useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    name: string
    label?: string
    showRequired?: boolean
    placeholder?: string
    help?: string
    rules?: RuleExpression<string>
    rows?: number
  }>(),
  {
    rows: 7
  }
)

defineModel<string>()
const { value } = useField<string>(props.name, props.rules)

const isEditing = ref(true)

const label = computed(() => props.label || props.name)
// Kinda stupid, but we have to do this because of minor vee-validate version mismatches and vue kinda messing up the types on ui-components build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typesafeRules = computed(() => props.rules as any)

const toggleEditor = () => (isEditing.value = !isEditing.value)
</script>
