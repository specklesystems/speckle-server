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
      <div v-else class="w-full">
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
