<template>
  <nav
    v-if="!hasNoModelCards"
    class="fixed top-0 h-10 bg-foundation max-w-full w-full shadow hover:shadow-md transition z-20"
  >
    <div class="px-2 select-none">
      <div class="flex items-center h-10 transition-all justify-between">
        <div class="flex items-center">
          <HeaderLogoBlock :active="false" minimal class="mr-0" />
          <!-- <div class="ml-2">Speckle</div> -->
          <div
            title="3.0 is coming!"
            class="ml-1 text-tiny bg-primary rounded-full px-2 py-[2px] text-foreground-on-primary transition hover:scale-110"
          >
            beta
          </div>
          <div class="flex flex-shrink-0 items-center -ml-2 md:ml-0">
            <PortalTarget name="navigation"></PortalTarget>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <FormButton
            v-if="!hostAppStore.isConnectorUpToDate"
            v-tippy="hostAppStore.latestAvailableVersion?.Number.replace('+0', '')"
            :icon-right="ArrowUpCircleIcon"
            size="sm"
            color="subtle"
            class="flex min-w-0 transition text-primary py-1 mr-1"
            @click.stop="hostAppStore.downloadLatestVersion()"
          >
            <span class="">Update</span>
          </FormButton>
          <HeaderUserMenu />
        </div>
      </div>
    </div>
  </nav>
</template>
<script setup lang="ts">
import { ArrowUpCircleIcon } from '@heroicons/vue/24/outline'
import { useHostAppStore } from '~/store/hostApp'

const hostAppStore = useHostAppStore()
const hasNoModelCards = computed(() => hostAppStore.projectModelGroups.length === 0)
</script>
