<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Install Manager ⚙️</template>
    <CommonVimeoEmbed
      vimeo-id="925892633"
      title="Onboarding: How to install Manager"
      autoplay
      controls
    />
    <div class="mt-2">
      <div
        v-if="hasSupportedOs"
        class="flex justify-center flex-col space-y-2 w-full items-center"
      >
        <FormButton
          size="lg"
          class="shadow-md"
          @click.stop="downloadManager(os === 'Windows' ? 'exe' : 'dmg')"
        >
          Download for {{ os }}
        </FormButton>
        <FormButton
          size="sm"
          text
          @click.stop="downloadManager(os === 'Windows' ? 'dmg' : 'exe')"
        >
          Download for {{ os === 'Windows' ? 'Mac OS' : 'Windows' }}
        </FormButton>
      </div>
      <div
        v-else
        class="flex justify-center flex-col space-y-2 text-body-xs text-foreground w-full items-center text-center"
      >
        <p>
          Speckle Connectors exist only for applications running on Windows or Mac OS.
          If you want, you can still go ahead and download Speckle Manager for
          <FormButton link @click="downloadManager('exe')">Windows</FormButton>
          or
          <FormButton link @click="downloadManager('dmg')">Mac OS</FormButton>
          .
        </p>
      </div>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { CommonVimeoEmbed } from '@speckle/ui-components'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'done'): void
}>()

const openState = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const hasDownloadedManager = useSynchronizedCookie<boolean>(`hasDownloadedManager`)

const getOs = () => {
  if (import.meta.server) return 'unknown'
  const userAgent = window.navigator.userAgent
  const platform =
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (window.navigator?.userAgentData?.platform as string) ||
    (window.navigator.platform as string)
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'MacOS', 'macOS']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
  const iosPlatforms = ['iPhone', 'iPad', 'iPod']
  let os = 'unknown'

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'Mac OS'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows'
  } else if (/Android/.test(userAgent)) {
    os = 'Android'
  } else if (/Linux/.test(platform)) {
    os = 'Linux'
  }

  return os
}

const os = ref(getOs())

const hasSupportedOs = computed(() => os.value === 'Windows' || os.value === 'Mac OS')

const mixpanel = useMixpanel()

const downloadManager = (ext: string | null = null) => {
  const extension = ext
    ? ext
    : os.value === 'Windows'
    ? 'exe'
    : os.value === 'Mac OS'
    ? 'dmg'
    : null

  if (!extension) return

  const fileName = `manager.${extension}`
  const downloadLink = `https://releases.speckle.dev/manager2/installer/${fileName}`

  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  a.href = downloadLink
  a.download = fileName
  a.click()
  document.body.removeChild(a)

  mixpanel.track('Manager Download', {
    os: fileName.includes('exe') ? 'win' : 'mac'
  })

  hasDownloadedManager.value = true
  emit('done')
}
</script>
