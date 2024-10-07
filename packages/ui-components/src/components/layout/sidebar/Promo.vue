<template>
  <div class="border border-outline-2 rounded-md py-3 px-4 select-none">
    <h6 v-if="title" class="text-body-xs font-medium text-foreground">{{ title }}</h6>
    <p v-if="text" class="text-body-2xs text-foreground-2">{{ text }}</p>
    <FormButton
      v-if="buttonText"
      size="sm"
      :to="to"
      text
      link
      @click="onClick ? handleClick : undefined"
    >
      {{ buttonText }}
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import FormButton from '~~/src/components/form/Button.vue'

const props = defineProps<{
  title?: string
  text?: string
  to?: string
  buttonText?: string
  onClick?: () => void
}>()

const handleClick = () => {
  if (props.onClick) {
    props.onClick()
  }
}
</script>
