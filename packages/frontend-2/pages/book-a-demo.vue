<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock no-link />
    </template>
    <template #header-right>
      <div class="flex gap-2 items-center">
        <FormButton
          class="opacity-70 hover:opacity-100 p-1"
          size="sm"
          color="subtle"
          @click="navigateTo(workspaceJoinRoute)"
        >
          Skip
        </FormButton>
        <FormButton color="outline" size="sm" @click="logout({ skipRedirect: false })">
          Sign out
        </FormButton>
      </div>
    </template>
    <div class="flex flex-col items-center justify-center p-4 relative">
      <h1 class="text-heading-xl text-foreground mb-3">
        <template v-if="!showEmbed">Book an intro call</template>
        <template v-else>Find a time</template>
      </h1>
      <template v-if="!showEmbed">
        <p class="text-body-sm text-foreground-2">We'd love to help you get started</p>
        <div class="flex flex-col gap-3 w-full md:max-w-96 mt-8">
          <FormRadioGroup v-model="bookDemoSelected" :options="options" is-stacked />
        </div>
      </template>
      <div v-else class="w-full mt-8 mb-6">
        <CalWidget />
      </div>
      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <div
          v-if="!showEmbed"
          :key="`book-a-demo-cta-${bookDemoSelected}`"
          v-tippy="!bookDemoSelected ? 'Please select an option' : ''"
          class="w-full"
        >
          <FormButton
            size="lg"
            submit
            full-width
            :disabled="!bookDemoSelected"
            @click="onCtaClick"
          >
            Continue
          </FormButton>
        </div>
        <FormButton v-else size="lg" full-width @click="navigateTo(workspaceJoinRoute)">
          Continue
        </FormButton>
      </div>
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useAuthManager } from '~/lib/auth/composables/auth'
import { workspaceJoinRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'

type BookDemoSelect = 'yes' | 'no'

definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})

const { logout } = useAuthManager()
const mixpanel = useMixpanel()

const bookDemoSelected = ref<BookDemoSelect | undefined>(undefined)
const showEmbed = ref(false)

const options = computed(() => [
  {
    value: 'yes',
    title: `Yes, let's talk`,
    subtitle: 'Find a time in the next step'
  },
  {
    value: 'no',
    title: 'No, maybe later',
    subtitle: 'You can also book a time later'
  }
])

const onCtaClick = () => {
  if (bookDemoSelected.value === 'yes') {
    showEmbed.value = true
    mixpanel.track('Book a Demo Selected')
  } else {
    mixpanel.track('Book a Demo Skipped')
    navigateTo(workspaceJoinRoute)
  }
}
</script>
