<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Install Manager ⚙️</template>
    <div class="relative bg-foundation">
      <div class="absolute inset-0 flex items-center justify-center" role="status">
        <svg
          aria-hidden="true"
          class="w-6 h-6 text-outline-2 animate-spin fill-primary"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span class="sr-only">Loading...</span>
      </div>

      <iframe
        title="Onboarding: How to install Manager"
        src="https://player.vimeo.com/video/925892633?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1"
        frameborder="0"
        allow="autoplay; fullscreen;"
        allowfullscreen
        class="aspect-video w-full relative z-10"
      ></iframe>
    </div>
    <div class="mt-2">
      <div v-if="hasSupportedOs" class="flex justify-center flex-col space-y-2">
        <FormButton
          size="xl"
          class="shadow-md"
          @click.stop="downloadManager(os === 'Windows' ? 'exe' : 'dmg')"
        >
          Download For {{ os }}
        </FormButton>
        <FormButton
          size="xs"
          text
          @click.stop="downloadManager(os === 'Windows' ? 'dmg' : 'exe')"
        >
          Download for {{ os === 'Windows' ? 'Mac OS' : 'Windows' }}
        </FormButton>
      </div>
      <div v-else class="flex justify-center flex-col space-y-2 text-sm sm:text-base">
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
  if (process.server) return 'unknown'
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
