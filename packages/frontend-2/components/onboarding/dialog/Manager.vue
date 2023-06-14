<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Install Manager ⚙️</template>
    <div
      class="w-full h-[351px] bg-primary rounded-xl flex items-center justify-center overflow-hidden"
    >
      <iframe
        width="560"
        height="315"
        src="https://www.youtube-nocookie.com/embed/ckP97qTGXDQ?rel=0&autoplay=1&"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        class="w-full h-full"
      ></iframe>
    </div>
    <div>
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
      <div v-else class="flex justify-center flex-col space-y-2">
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
