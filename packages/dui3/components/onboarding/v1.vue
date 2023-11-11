<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <div :class="`${background ? 'px-2 bg-foundation rounded-md shadow-xl' : ''}`">
      <div
        v-if="!allCompleted && !skipped"
        :class="`grid gap-2 ${showIntro ? 'px-4 grid-cols-5' : 'grid-cols-5'}`"
      >
        <div class="flex items-center justify-center col-start-2 col-end-5">
          <div class="space-x-1">
            <FormButton v-if="!allCompleted" size="sm" @click="markCompleteAll()">
              I'll do onboarding later
            </FormButton>
          </div>
        </div>
        <div
          v-if="!showIntro"
          class="flex-col justify-around px-2 h-full py-2 md:col-span-1 hidden lg:flex"
        >
          <div>Quickstart Checklist</div>
          <div class="text-sm text-foreground-2">
            Become a Speckle pro in four steps!
          </div>
          <div class="space-x-1">
            <FormButton v-if="!allCompleted" size="sm" @click="dismissChecklist()">
              I'll do it later
            </FormButton>
            <FormButton
              v-if="!allCompleted"
              text
              size="xs"
              @click="dismissChecklistForever()"
            >
              Don't show again
            </FormButton>
          </div>
        </div>
        <div class="grid grid-cols-1 grow col-span-5 lg:col-span-5">
          <!-- Steps -->
          <div
            class="flex justify-between items-center row-start-1 row-end-3 absolute border border-dashed border-blue-500/10 z-[1]"
          ></div>
          <div
            v-for="(step, idx) in steps"
            :key="idx"
            class="flex justify-between items-center py-1 grid grid-cols-12 col-span-2 sm:col-span-2 col-span-1"
          >
            <div class="flex items-center justify-center">
              <FormButton
                v-tippy="'Mark completed'"
                class="flex justify-between items-center"
                text
                link
                size="xs"
                :color="step.completed ? 'success' : 'danger'"
                @click.stop="markComplete(idx)"
              >
                <!-- Mark as complete -->
                <CheckCircleIcon class="w-6 h-6 z-[5] bg-white rounded-full" />
              </FormButton>
            </div>
            <div
              :class="`
          ${
            step.active
              ? 'bg-primary text-foreground-on-primary shadow hover:shadow-md scale-100'
              : 'text-foreground-2 hover:bg-primary-muted scale-95 hover:scale-100'
          } 
          col-span-11 transition rounded-md flex flex-row px cursor-pointer h-full mb-1`"
              @click.stop="
                !step.active
                  ? activateStep(idx)
                  : idx === 0 || steps[idx - 1].completed
                  ? step.action()
                  : goToFirstUncompletedStep()
              "
            >
              <div class="grid grid-cols-4 grow">
                <div
                  :class="`pl-2 flex items-center justify-between ${
                    step.active ? 'pl-4 font-bold text-forergound-on-primary' : ''
                  }`"
                >
                  {{ step.title }}
                </div>
                <div class="flex items-center justify-between text-xs col-span-2">
                  {{ step.blurb }}
                </div>
                <div class="flex items-center justify-end pr-0.5">
                  <FormButton
                    v-if="!step.completed && step.active"
                    size="sm"
                    :disabled="!step.active"
                    color="invert"
                    @click.stop="step.action"
                  >
                    {{ step.cta }}
                  </FormButton>
                  <FormButton
                    v-if="step.completed && step.active"
                    text
                    link
                    size="xs"
                    color="invert"
                    @click.stop="step.action"
                  >
                    {{ step.postCompletionCta }}
                  </FormButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="showIntro"
          class="lg:hidden col-span-5 pb-3 pt-2 text-center space-x-2"
        >
          <FormButton v-if="!allCompleted" size="sm" @click="dismissChecklist()">
            I'll do it later
          </FormButton>
          <FormButton
            v-if="!allCompleted"
            text
            size="xs"
            @click="dismissChecklistForever()"
          >
            Don't show again
          </FormButton>
        </div>
      </div>
      <div
        v-else
        class="flex flex-col sm:flex-row items-center justify-center flex-1 space-x-2 py-4"
      >
        <div class="text-sm max-w-lg grow mb-1">
          <b>All done!</b>
          PS: the
          <FormButton to="https://speckle.community" target="_blank" size="sm">
            Community Forum
          </FormButton>
          is there to help!
        </div>
        <div>
          <FormButton text size="sm" @click="closeChecklist()">Go Home!</FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ConnectorOnboarding,
  ConnectorOnboardingDictionary
} from 'lib/bindings/definitions/IConfigBinding'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { useConfigStore } from '~/store/config'
const configStore = useConfigStore()
const router = useRouter()

const emit = defineEmits(['dismiss'])

withDefaults(
  defineProps<{
    showIntro?: boolean
    showBottomEscape?: boolean
    background?: boolean
  }>(),
  {
    showIntro: false,
    showBottomEscape: false,
    background: false
  }
)

const connectorOnboarding = computed(
  () =>
    configStore.config?.connectors['mock']?.onboarding as unknown as ConnectorOnboarding
)

const steps = ref(
  Object.entries(
    connectorOnboarding.value.onboardings as unknown as ConnectorOnboardingDictionary
  ).map(([key, value]) => {
    return {
      ...value,
      id: key,
      active: false,
      action: () => {},
      completionAction: () => {},
      cta: "Let's go!",
      postCompletionCta: `${value.title} again!`
    }
  })
)

const allCompleted = computed(() => steps.value.every((step) => step.completed))

const skipped = computed(
  () => configStore.config?.connectors['mock']?.onboarding.skipped
)

const activateStep = (idx: number) => {
  steps.value.forEach((s, index) => (s.active = idx === index))
}

const goToFirstUncompletedStep = () => {
  const firstNonCompleteStepIndex = steps.value.findIndex((s) => s.completed === false)

  activateStep(firstNonCompleteStepIndex)
}

const markComplete = (idx: number) => {
  steps.value[idx].completed = true
  steps.value[idx].active = false
  steps.value[idx].completionAction()
  configStore.completeConnectorOnboarding(steps.value[idx].id)
  activateStep(idx + 1)
}

const markCompleteAll = () => {
  steps.value.forEach((step) => {
    step.completed = true
    step.completionAction() // TODO: Not sure!
  })
  configStore.skipOnboarding()
}

const getStatus = () => {
  return steps.value.map((step) => ({
    [step.id]: step.completed
  }))
}

const closeChecklist = () => {
  router.push('/')
}

const dismissChecklist = () => {
  // hasDismissedChecklistTime.value = Date.now().toString()
  emit('dismiss')
  router.push('/')
  // mp.track('Onboarding Action', {
  //   type: 'action',
  //   name: 'checklist',
  //   action: 'dismiss',
  //   status: getStatus()
  // })
}

const dismissChecklistForever = () => {
  //hasDismissedChecklistForever.value = true
  emit('dismiss')
  // mp.track('Onboarding Action', {
  //   type: 'action',
  //   name: 'checklist',
  //   action: 'dismiss-forever',
  //   status: getStatus()
  // })
}

goToFirstUncompletedStep()
</script>
