<template>
  <CommonCard
    class="w-full border-outline-2 !p-4"
    :class="{
      'cursor-pointer hover:border-outline-3 shadow-sm hover:border-zinc-400 bg-foundation':
        clickable,
      '!py-2 !px-4': condensed
    }"
    @click="clickable && onClick"
  >
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <div class="flex gap-4">
        <WorkspaceAvatar :name="name" :logo="logo" :size="condensed ? 'base' : 'xl'" />
        <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
          <div class="flex flex-col items-start text-body-2xs text-foreground-2">
            <h6
              class="text-foreground"
              :class="condensed ? 'text-body-2xs font-medium' : 'text-heading-sm'"
            >
              {{ name }}
            </h6>
            <slot name="text"></slot>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-y-2" @click.stop>
        <slot name="actions"></slot>
      </div>
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  logo: string
  name: string
  clickable?: boolean
  condensed?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const onClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>
