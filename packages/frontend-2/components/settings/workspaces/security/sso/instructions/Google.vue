<template>
  <div class="text-body-xs">
    <ol class="list-decimal pl-4 space-y-3">
      <li>
        Go to
        <NuxtLink
          href="https://console.cloud.google.com"
          target="_blank"
          class="text-primary"
        >
          Google Cloud Console
        </NuxtLink>
      </li>
      <li>Create a new project or select an existing one</li>
      <li>
        Enable the
        <span class="font-medium">OAuth 2.0</span>
        API
      </li>
      <li>
        Create
        <span class="font-medium">OAuth 2.0</span>
        credentials
        <span>(</span>
        <span class="font-medium">Web application</span>
        <span>)</span>
      </li>
      <li>
        Add the following
        <span class="font-medium">Authorized JavaScript origin</span>
        :
        <CommonClipboardInputWithToast class="mt-2" is-multiline :value="apiOrigin" />
      </li>
      <li>
        Add the following
        <span class="font-medium">Authorized redirect URIs</span>
        :
        <div class="flex flex-col gap-2 mt-2">
          <CommonClipboardInputWithToast is-multiline :value="redirectUrl" />
          <CommonClipboardInputWithToast
            is-multiline
            :value="redirectUrlWithoutValidate"
          />
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const apiOrigin = useApiOrigin()

const props = defineProps<{
  redirectUrl: string
}>()

const redirectUrlWithoutValidate = computed<string>(() => {
  const url = new URL(props.redirectUrl as string)
  url.searchParams.delete('validate')
  return url.toString()
})
</script>
