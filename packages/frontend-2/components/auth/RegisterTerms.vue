<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="mt-2 text-body-2xs text-foreground-2 text-center terms-of-service"
    v-html="serverInfo.termsOfService"
  />
</template>

<script setup lang="ts">
import type { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'

defineProps<{
  serverInfo: ServerTermsOfServicePrivacyPolicyFragmentFragment
}>()

graphql(`
  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {
    termsOfService
  }
`)
</script>
