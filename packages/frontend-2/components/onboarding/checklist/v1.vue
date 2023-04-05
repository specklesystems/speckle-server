<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <div :class="`${background ? 'px-2 bg-foundation rounded-md shadow-xl' : ''}`">
      <div
        v-if="!allCompleted"
        :class="`grid  gap-2 ${showIntro ? 'px-4 grid-cols-5' : 'grid-cols-4'}`"
      >
        <div v-if="showIntro" class="flex flex-col justify-around px-2 h-full py-2">
          <div>Quickstart Checklist</div>
          <div class="text-sm text-foreground-2">
            Become a Speckle pro in four steps!
          </div>
          <div>
            <FormButton v-if="!allCompleted" size="sm" @click="dismissChecklist()">
              I'll do it later
            </FormButton>
          </div>
        </div>
        <div v-for="(step, idx) in steps" :key="idx" class="py-2 col-span-1">
          <div
            :class="`
          ${
            step.active
              ? 'bg-primary text-foreground-on-primary shadow hover:shadow-md scale-100'
              : 'text-foreground-2 hover:bg-primary-muted scale-95'
          } 
          transition rounded-md flex flex-col justify-between px-2 cursor-pointer h-full`"
            @click.stop="
              !step.active
                ? activateStep(idx)
                : idx === 0 || steps[idx - 1].completed
                ? step.action()
                : goToFirstUncompletedStep()
            "
          >
            <div
              :class="`text-xl font-bold flex items-center justify-between ${
                step.active ? 'text-foreground-on-primary' : 'text-foreground-2'
              }`"
            >
              <span>{{ idx + 1 }}</span>
              <Component
                :is="step.icon"
                v-if="!step.completed"
                :class="`w-4 h-4 mt-1`"
              />
              <CheckCircleIcon v-else class="w-4 h-4 mt-1 text-primary" />
            </div>
            <div
              :class="`${step.active ? 'font-bold text-forergound-on-primary' : ''}`"
            >
              {{ step.title }}
            </div>
            <div class="text-xs mt-[2px]">{{ step.blurb }}</div>
            <div class="h-10 flex items-center justify-between">
              <div
                v-if="idx === 0 || steps[idx - 1].completed"
                class="flex justify-between items-center py-2 w-full"
              >
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
                  v-if="step.active && !step.completed"
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
              <div v-else-if="step.active" class="text-sm">
                <FormButton
                  link
                  size="xs"
                  color="invert"
                  @click.stop="goToFirstUncompletedStep()"
                >
                  Complete the previous step!
                </FormButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex flex-col items-center justify-center flex-1 space-y-2 py-4"
      >
        <div class="w-6 h-6">
          <!-- <CheckCircleIcon class="absolute w-6 h-6 text-primary" /> -->
          <CheckCircleIcon
            class="absolute w-6 h-6 text-primary animate-ping animate-bounce"
          />
        </div>
        <div class="text-sm max-w-xl text-center">
          <b>All done!</b>
          <br />
          Don't forget to join us in the
          <FormButton
            to="https://speckle.community"
            target="_blank"
            size="xs"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            Community Forum
          </FormButton>
          , or check out the
          <FormButton
            to="https://speckle.systems/tutorials"
            target="_blank"
            size="xs"
            :icon-right="ArrowTopRightOnSquareIcon"
          >
            Tutorials
          </FormButton>
          page for more inisghts.
        </div>
        <FormButton text size="sm" @click="closeChecklist()">Close</FormButton>
      </div>
    </div>

    <!--
      This is used as a dismissal prompt from when showing the checklist on top of the
      viewer. It does not directly dismiss the checklist as we still want to show it
      on the main dasboard page.  
    -->
    <div v-if="showBottomEscape" class="text-center mt-2">
      <FormButton size="sm" @click="$emit('dismiss')">
        I'll do it later - let me explore first!
      </FormButton>
    </div>

    <OnboardingDialogManager
      v-show="showManagerDownloadDialog"
      @done="markComplete(0)"
      @cancel="showManagerDownloadDialog = false"
    ></OnboardingDialogManager>
    <OnboardingDialogAccountLink
      v-show="showAccountLinkDialog"
      @done="markComplete(1)"
      @cancel="showAccountLinkDialog = false"
    >
      <template #header>Desktop Login</template>
    </OnboardingDialogAccountLink>
    <OnboardingDialogFirstSend
      v-show="showFirstSendDialog"
      @done="markComplete(2)"
      @cancel="showFirstSendDialog = false"
    >
      <template #header>Your First Upload</template>
    </OnboardingDialogFirstSend>
    <ServerInviteDialog
      v-model:open="showServerInviteDialog"
      @update:open="(v) => (!v ? markComplete(3) : '')"
    />
  </div>
</template>
<script setup lang="ts">
import {
  CheckCircleIcon,
  ShareIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
  CloudArrowUpIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import { CheckCircleIcon as OutlineCheckCircleIcon } from '@heroicons/vue/24/outline'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

withDefaults(
  defineProps<{ showIntro: boolean; showBottomEscape: boolean; background: boolean }>(),
  {
    showIntro: false,
    showBottomEscape: false,
    background: false
  }
)

const emit = defineEmits(['dismiss'])

const showManagerDownloadDialog = ref(false)
const showAccountLinkDialog = ref(false)
const showFirstSendDialog = ref(false)
const showServerInviteDialog = ref(false)

const hasDownloadedManager = useSynchronizedCookie<boolean>(`hasDownloadedManager`, {
  default: () => false
})
const hasLinkedAccount = useSynchronizedCookie<boolean>(`hasLinkedAccount`, {
  default: () => false
})
const hasViewedFirstSend = useSynchronizedCookie<boolean>(`hasViewedFirstSend`, {
  default: () => false
})
const hasSharedProject = useSynchronizedCookie<boolean>(`hasSharedProject`, {
  default: () => false
})
const hasCompletedChecklistV1 = useSynchronizedCookie<boolean>(
  `hasCompletedChecklistV1`,
  { default: () => false }
)
const hasDismissedChecklistTime = useSynchronizedCookie<string | undefined>(
  `hasDismissedChecklistTime`,
  { default: () => undefined }
)

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
    completionAction: () => {
      showManagerDownloadDialog.value = false
      hasDownloadedManager.value = true
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
    completionAction: () => {
      showAccountLinkDialog.value = false
      hasLinkedAccount.value = true
    },
    completed: hasLinkedAccount.value,
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
    completionAction: () => {
      showFirstSendDialog.value = false
      hasViewedFirstSend.value = true
    },
    completed: hasViewedFirstSend.value,
    icon: CloudArrowUpIcon
  },
  {
    title: 'Enable Multiplayer',
    blurb: 'Share your project with your colleagues!',
    active: false,
    cta: "Let's go!",
    postCompletionCta: 'Invite Again',
    action: () => {
      showServerInviteDialog.value = true
      //TODO: modify server invite dialog to include searchable project dropdown
    },
    completionAction: () => {
      showServerInviteDialog.value = false
      hasSharedProject.value = true
    },
    completed: hasSharedProject.value,
    icon: ShareIcon
  }
])

const activateStep = (idx: number) => {
  steps.value.forEach((s, index) => (s.active = idx === index))
}

const markComplete = (idx: number) => {
  steps.value[idx].completed = true
  steps.value[idx].active = false
  steps.value[idx].completionAction()
  activateStep(idx + 1)
}

const goToFirstUncompletedStep = () => {
  const firstNonCompleteStepIndex = steps.value.findIndex((s) => s.completed === false)
  activateStep(firstNonCompleteStepIndex)
}

const allCompleted = computed(() => steps.value.every((step) => step.completed))

const closeChecklist = () => {
  hasCompletedChecklistV1.value = true
}

const dismissChecklist = () => {
  // TODO
  hasDismissedChecklistTime.value = Date.now().toString()
  emit('dismiss')
}

goToFirstUncompletedStep()
</script>
