<template>
  <div>
    <PromoBannersBanner
      v-if="activeBanner"
      :id="activeBanner.id"
      :primary-text="activeBanner.primaryText"
      :secondary-text="activeBanner.secondaryText"
      :url="activeBanner.url"
      @banner-dismissed="activeBanner && handleDismissed(activeBanner.id)"
    ></PromoBannersBanner>
  </div>
</template>

<script setup lang="ts">
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import dayjs from 'dayjs'
import type { PromoBanner } from '~/lib/promo-banners/types'

const props = defineProps<{
  banners: PromoBanner[]
}>()

const hideAllPromoBanners = useSynchronizedCookie<boolean>('hide-all-promo-banners', {
  expires: dayjs().add(1, 'day').toDate()
})

// Initialize a map to hold cookie references
const bannerCookies = ref<Map<string, Ref<boolean>>>(new Map())

// Prepare the cookies for each banner
props.banners.forEach((banner) => {
  bannerCookies.value.set(
    banner.id,
    useSynchronizedCookie<boolean>(`banner-dismissed-${banner.id}`)
  )
})

const activeBannerId = ref<string | null>(null)

const sortedBanners = computed(() =>
  [...props.banners].sort((a, b) => a.priority - b.priority)
)

// Determine the active banner based on the sorted list and cookie status
sortedBanners.value.forEach((banner) => {
  const cookie = bannerCookies.value.get(banner.id)
  if (cookie && !cookie.value && !hideAllPromoBanners.value && !activeBannerId.value) {
    activeBannerId.value = banner.id
  }
})

const activeBanner = computed(() =>
  activeBannerId.value
    ? props.banners.find((banner) => banner.id === activeBannerId.value)
    : null
)

function handleDismissed(id: string) {
  hideAllPromoBanners.value = true
  activeBannerId.value = null

  const dismissedCookie = bannerCookies.value.get(id)
  if (dismissedCookie) {
    dismissedCookie.value = true
  }
}
</script>
