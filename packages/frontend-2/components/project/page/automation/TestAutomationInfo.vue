<template>
  <div>
    <h2 class="h6 font-medium mb-6">Configuration</h2>
    <CommonCard class="bg-foundation">
      <FormSelectBase
        v-model="selectedLanguage"
        class="mb-2"
        name="language"
        label="Language"
        :items="items"
      >
        <template #option="{ item }">
          <p>{{ item }}</p>
        </template>
        <template #something-selected="{ value }">
          <p>{{ value }}</p>
        </template>
      </FormSelectBase>
      <div class="relative mb-4 w-full bg-foundation-2 rounded-md">
        <div class="w-full p-2 overflow-x-auto">
          <pre
            class="font-mono text-foreground text-body-xs -translate-y-px leading-normal"
            >{{ environment }}</pre
          >
        </div>
        <button
          class="absolute flex items-center justify-center bottom-2 right-2 w-8 h-8 rounded-md border border-outline-3 bg-foundation"
          @click="handleCopy"
        >
          <Clipboard
            :size="LucideSize.lg"
            :stroke-width="1.5"
            :absolute-stroke-width="true"
            class="text-foreground"
          />
        </button>
      </div>
      <CommonTextLink
        size="sm"
        external
        target="_blank"
        to="https://speckle.guide/automate/function-testing.html"
      >
        Using test automations
      </CommonTextLink>
      <CommonTextLink
        size="sm"
        external
        target="_blank"
        to="https://speckle.guide/dev/tokens.html"
      >
        Create a personal access token
      </CommonTextLink>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import { Clipboard } from 'lucide-vue-next'

const props = defineProps<{
  projectId: string
  automationId: string
}>()

const origin = useApiOrigin()
const { copy } = useClipboard()

const selectedLanguage = defineModel<string>('selectedLanguage', {
  default: 'python'
})

const items = ref(['python', 'dotnet'])

const environment = computed(() => {
  switch (selectedLanguage.value) {
    case 'python': {
      return [
        'SPECKLE_TOKEN="YOUR-TOKEN-HERE"',
        `SPECKLE_SERVER_URL="${origin}"`,
        `SPECKLE_PROJECT_ID="${props.projectId}"`,
        `SPECKLE_AUTOMATION_ID="${props.automationId}"`
      ].join('\n')
    }
    case 'dotnet': {
      return JSON.stringify(
        {
          SpeckleToken: 'YOUR-TOKEN-HERE',
          SpeckleServerUrl: origin,
          SpeckleProjectId: props.projectId,
          SpeckleAutomationId: props.automationId
        },
        null,
        2
      )
    }
    default: {
      return ''
    }
  }
})

const handleCopy = () => {
  copy(environment.value, {
    successMessage: 'Configuration copied to clipboard.'
  })
}
</script>
