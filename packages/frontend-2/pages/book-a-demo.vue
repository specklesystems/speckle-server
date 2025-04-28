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
      <h1 class="text-heading-xl text-foreground mb-6 font-normal">Book a demo</h1>
      <template v-if="!showEmbed">
        <p class="text-body-sm text-foreground mb-6">Would you like to book a demo?</p>
        <div class="flex flex-col gap-3 w-full md:max-w-96">
          <FormRadioGroup v-model="bookDemoSelected" :options="options" is-stacked />
        </div>
      </template>
      <div v-else class="w-full max-w-5xl">
        <div class="bg-foundation-page">
          <iframe
            src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2_p9mPs9Mi1NfAPKqUA3GVauvG_Sw114KlgA37JsGAwhXeGyLC8CSa-bzfQ6VXewwpGdVVcnV5?gv=true"
            style="border: 0; background: #fafafa"
            class="rounded-xl"
            width="100%"
            height="600"
            frameborder="0"
            title="Book a demo"
          />
        </div>
      </div>
      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <FormButton v-if="!showEmbed" size="lg" submit full-width @click="onCtaClick">
          Continue
        </FormButton>
        <FormButton
          v-else
          color="subtle"
          size="lg"
          full-width
          @click="navigateTo(workspaceJoinRoute)"
        >
          Skip
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
    title: `Yes`,
    subtitle: 'Some copy here to convince them'
  },
  {
    value: 'no',
    title: 'No',
    subtitle: 'Some sad copy here'
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
