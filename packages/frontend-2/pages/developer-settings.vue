<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        to="/developer-settings/"
        name="Developer Settings"
      ></HeaderNavLink>
    </Portal>
    <div class="flex flex-col gap-16">
      <DeveloperSettingsSectionHeader
        title="Developer Settings"
        text="Heads up! The sections below are intended for developers."
        :buttons="[
          {
            props: { color: 'primary', to: apiOrigin },
            events: { click: console.log(1) },
            label: 'Explore GraphQL'
          }
        ]"
      />
      <DeveloperSettingsSectionHeader
        title="Access Tokens"
        text="Personal Access Tokens can be used to access the Speckle API on this server; they function like ordinary OAuth access tokens. Use them in your scripts or apps! 
<strong>Treat them like a password: do not post them anywhere where they could be accessed by others (e.g., public repos).</strong>"
        :buttons="[
          {
            props: {
              color: 'invert',
              to: 'https://speckle.guide/dev/tokens.html',
              iconLeft: BookOpenIcon,
              target: '_blank',
              external: true
            },
            events: { click: console.log(1) },
            label: 'Open Docs'
          },
          {
            props: { color: 'primary', to: 'https://google.com', iconLeft: PlusIcon },
            events: { click: console.log(1) },
            label: 'New Token'
          }
        ]"
      />
      <DeveloperSettingsSectionHeader
        title="Applications"
        text="Register and manage third-party Speckle Apps that, once authorised by a user on this server, can act on their behalf."
        :buttons="[
          {
            props: {
              color: 'invert',
              to: 'https://speckle.guide/dev/apps.html',
              target: '_blank',
              external: true,
              iconLeft: BookOpenIcon
            },
            events: { click: console.log(1) },
            label: 'Open Docs'
          },
          {
            props: { color: 'primary', to: 'https://google.com', iconLeft: PlusIcon },
            events: { click: console.log(1) },
            label: 'New Application'
          }
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, BookOpenIcon } from '@heroicons/vue/24/outline'

const {
  public: { apiOrigin }
} = useRuntimeConfig()

// definePageMeta({
//   middleware: ['require-valid-project']
// })
</script>
