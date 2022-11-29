<template>
  <nav class="flex justify-center" :aria-label="ariaLabel || 'Progress steps'">
    <ol :class="[listClasses, basic ? 'basic' : '']">
      <li v-for="(step, i) in steps" :key="step.name">
        <a
          v-if="isFinishedStep(i)"
          :href="step.href"
          :class="linkClasses"
          @click="(e) => switchStep(i, e)"
        >
          <span class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <span v-if="basic" class="h-3 w-3 rounded-full bg-foreground-2" />
            <CheckCircleIcon
              v-else
              class="h-full w-full text-primary"
              aria-hidden="true"
            />
          </span>
          <span :class="['text-foreground', labelClasses]">
            {{ step.name }}
          </span>
        </a>
        <a
          v-else-if="isCurrentStep(i)"
          :href="step.href"
          :class="linkClasses"
          aria-current="step"
          @click="(e) => switchStep(i, e)"
        >
          <span
            class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <template v-if="basic">
              <span class="h-3 w-3 rounded-full bg-foreground" />
            </template>
            <template v-else>
              <span class="absolute h-4 w-4 rounded-full bg-primary-outline-2" />
              <span class="relative block h-2 w-2 rounded-full bg-primary-focus" />
            </template>
          </span>
          <span :class="['text-primary-focus', labelClasses]">
            {{ step.name }}
          </span>
        </a>
        <a
          v-else
          :href="step.href"
          :class="linkClasses"
          @click="(e) => switchStep(i, e)"
        >
          <div
            class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <span v-if="basic" class="h-3 w-3 rounded-full bg-foreground-2" />
            <div v-else class="h-4 w-4 rounded-full bg-foreground-disabled" />
          </div>
          <p :class="['text-foreground-disabled', labelClasses]">
            {{ step.name }}
          </p>
        </a>
      </li>
    </ol>
  </nav>
</template>
<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/20/solid'
import { useStepsInternals } from '~~/lib/common/composables/steps'
import { BulletStepType, HorizontalOrVertical } from '~~/lib/common/helpers/components'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
}>()

const props = defineProps<{
  ariaLabel?: string
  basic?: boolean
  orientation?: HorizontalOrVertical
  steps: BulletStepType[]
  modelValue?: number
  goVerticalBelow?: TailwindBreakpoints
  nonInteractive?: boolean
}>()

const { isCurrentStep, isFinishedStep, switchStep, listClasses, linkClasses } =
  useStepsInternals({
    props: toRefs(props),
    emit
  })

const labelClasses = computed(() => {
  const classParts: string[] = ['ml-3 h6 font-medium leading-7']

  if (props.basic) {
    classParts.push('sr-only')
  }

  return classParts.join(' ')
})
</script>
<style scoped>
.basic {
  @apply space-x-4 !important;
}
</style>
