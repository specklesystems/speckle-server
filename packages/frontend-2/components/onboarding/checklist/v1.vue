<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="hidden layout-container rounded-2xl md:flex justify-between items-center border-b-2 border-primary-muted"
  >
    <div class="grid grid-cols-5 gap-2">
      <div v-for="(step, idx) in steps" :key="idx" class="py-2 col-span-1">
        <div
          :class="`${
            step.active
              ? 'bg-primary text-foreground-on-primary shadow hover:shadow-md scale-100'
              : 'text-foreground-2 hover:bg-primary-muted scale-95'
          } transition rounded-md flex flex-col justify-between px-2 cursor-pointer h-full`"
          @click.stop="!step.active ? activateStep(idx) : step.action()"
        >
          <div
            :class="`text-xl font-bold flex items-center justify-between ${
              step.active ? 'text-foreground-on-primary' : 'text-foreground-2'
            }`"
          >
            <span>{{ idx + 1 }}</span>
            <Component :is="step.icon" v-if="!step.completed" :class="`w-4 h-4 mt-1`" />
            <CheckCircleIcon v-else class="w-4 h-4 mt-1" />
          </div>
          <div :class="`${step.active ? 'font-bold text-forergound-on-primary' : ''}`">
            {{ step.title }}
          </div>
          <div class="text-xs mt-[2px]">{{ step.blurb }}</div>
          <div class="flex justify-between items-center py-2">
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
              v-if="step.active && idx !== steps.length - 1 && !step.completed"
              v-tippy="'Mark completed'"
              text
              link
              size="xs"
              color="invert"
              @click.stop="markComplete(idx)"
            >
              <!-- Mark as complete -->
              <OutlineCheckCircleIcon class="w-4 h-4" />
            </FormButton>
            <span v-if="step.completed" class="text-xs font-bold">Completed!</span>
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
      <div class="flex items-center justify-end">
        <FormButton v-if="!allCompleted" text size="sm">Dismiss</FormButton>
        <div v-else>
          <FormButton text size="sm">Close Checklist</FormButton>
        </div>
      </div>
    </div>

    <OnboardingDialogManager
      v-show="showManagerDownloadDialog"
      @close=";(showManagerDownloadDialog = false), markComplete(0)"
      @cancel="showManagerDownloadDialog = false"
    ></OnboardingDialogManager>
    <OnboardingDialogAccountLink
      v-show="showAccountLinkDialog"
      @close=";(showAccountLinkDialog = false), markComplete(1)"
      @cancel="showAccountLinkDialog = false"
    >
      <template #header>Desktop Login</template>
    </OnboardingDialogAccountLink>
    <OnboardingDialogFirstSend
      v-show="showFirstSendDialog"
      @close=";(showFirstSendDialog = false), markComplete(2)"
      @cancel="showFirstSendDialog = false"
    >
      <template #header>Your First Upload</template>
    </OnboardingDialogFirstSend>
  </div>
</template>
<script setup lang="ts">
import {
  CheckCircleIcon,
  ShareIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
  CloudArrowUpIcon
} from '@heroicons/vue/24/solid'
import { CheckCircleIcon as OutlineCheckCircleIcon } from '@heroicons/vue/24/outline'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

const showManagerDownloadDialog = ref(false)
const showAccountLinkDialog = ref(false)
const showFirstSendDialog = ref(false)
const hasDownloadedManager = useSynchronizedCookie<boolean>(`hasDownloadedManager`)

const steps = ref([
  {
    title: 'Get Connectors',
    blurb: 'Use Manager to install the Speckle Connectors for your apps!',
    active: false,
    cta: "Let's go!",
    postCompletionCta: 'Download Again',
    action: () => {
      showManagerDownloadDialog.value = true
    },
    completed: hasDownloadedManager.value,
    icon: ComputerDesktopIcon
  },
  {
    title: 'Desktop Login',
    blurb: 'Authorise our application connectors to send data to Speckle.',
    active: false,
    cta: "Let's go!",
    postCompletionCta: 'Login Again',
    action: () => {
      showAccountLinkDialog.value = true
    },
    completed: false,
    icon: UserPlusIcon
  },
  {
    title: 'Send your first model',
    blurb: 'Use your favourite design app to send your first model to Speckle.',
    active: false,
    cta: "Let's go!",
    postCompletionCta: 'Show Again',
    action: () => {
      showFirstSendDialog.value = true
    },
    completed: false,
    icon: CloudArrowUpIcon
  },
  {
    title: 'Enable Multiplayer',
    blurb: 'Share your project with your colleagues!',
    active: false,
    cta: "Let's go!",
    postCompletionCta: 'Download Again',
    action: () => {
      //TODO
    },
    completed: false,
    icon: ShareIcon
  }
])

const activateStep = (idx: number) => {
  steps.value.forEach((s, index) => (s.active = idx === index))
}

const markComplete = (idx: number) => {
  steps.value[idx].completed = true
  steps.value[idx].active = false
  activateStep(idx + 1)
}

const allCompleted = computed(() => steps.value.every((step) => step.completed))

// Open up first non-completed step
const firstNonCompleteStepIndex = steps.value.findIndex((s) => !!s.completed) + 1
activateStep(firstNonCompleteStepIndex)
</script>
