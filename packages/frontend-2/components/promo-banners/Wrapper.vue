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

const bannerCookies = ref<Map<string, Ref<boolean>>>(new Map())
const activeBannerId = ref<string | null>(null)

props.banners.forEach((banner) => {
  bannerCookies.value.set(
    banner.id,
    useSynchronizedCookie<boolean>(`banner-dismissed-${banner.id}`)
  )
})

const sortedBanners = computed(() => {
  return props.banners
    .filter((banner) => {
      const expiryDate = dayjs(banner.expiryDate, 'YYYY-MM-DD')
      return dayjs().isBefore(expiryDate)
    })
    .sort((a, b) => a.priority - b.priority)
})

// Determine the active banner based on the sorted list, expiry date and cookie status
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
