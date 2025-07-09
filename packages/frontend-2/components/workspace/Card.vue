<template>
  <CommonCard
    class="w-full border-outline-2 !py-3 px-4"
    :class="{
      'cursor-pointer hover:border-outline-3 shadow-sm hover:border-zinc-400 bg-foundation':
        clickable
    }"
    @click="clickable && onClick"
  >
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <div class="flex gap-3">
        <WorkspaceAvatar :name="name" :logo="logo" size="lg" />
        <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
          <div class="flex flex-col items-start text-body-2xs text-foreground-2 gap-1">
            <h6 class="text-foreground text-body-sm font-medium">
              {{ name }}
            </h6>
            <slot name="text"></slot>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-y-2 items-end" @click.stop>
        <slot name="actions"></slot>
      </div>
    </div>
    <div
      v-if="bannerText"
      class="mt-3 text-body-3xs text-center text-success-700 bg-success-50 px-2 py-1 w-full bg-foundation-page rounded-md border-outline-3 border"
    >
      {{ bannerText }}
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  logo?: string
  name: string
  clickable?: boolean
  bannerText?: string | null
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
