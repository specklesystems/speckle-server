<template>
  <div class="flex flex-col space-y-2">
    <div class="text-sm font-medium text-foreground-2 flex items-center space-x-1">
      <span>{{ label }}</span>
      <InformationCircleIcon
        v-tippy="{
          content: tooltipContent,
          allowHTML: true,
          interactive: true,
          appendTo: () => body
        }"
        class="w-4 h-4 outline-none"
      />
      <div class="grow" />
      <CommonTextLink
        v-if="!isEditing || !isPreviewDisabled"
        size="sm"
        @click="toggleEditor"
      >
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
      :show-required="showRequired"
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
  </div>
</template>
<script setup lang="ts">
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
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

const body = computed(() => (import.meta.client ? document.body : undefined))
const isEditing = ref(true)
const isPreviewDisabled = computed(() => !(value.value || '').trim().length)

const label = computed(() => props.label || props.name)
const tooltipContent = computed(
  () =>
    `This field supports markdown. <a href="https://www.markdownguide.org/basic-syntax/" class="underline" target="_blank">Click here</a> for more info.`
)

// Kinda stupid, but we have to do this because of minor vee-validate version mismatches and vue kinda messing up the types on ui-components build
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
const typesafeRules = computed(() => props.rules as any)

const toggleEditor = () => (isEditing.value = !isEditing.value)
</script>
