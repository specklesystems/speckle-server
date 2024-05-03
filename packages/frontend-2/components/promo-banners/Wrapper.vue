<template>
  <div>
    <PromoBannersBanner
      v-if="activeBanner"
      :id="activeBanner.id"
      :primary-text="activeBanner.primaryText"
      :secondary-text="activeBanner.secondaryText"
      :url="activeBanner.url"
      :image-src="activeBanner.imageSrc"
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

const hideAllPromoBanners = useSynchronizedCookie('hide-all-promo-banners', {
  default: () => false,
  expires: dayjs().add(1, 'day').toDate()
})

const activeBannerId = ref<string | null>(null)

const sortedBanners = computed(() =>
  [...props.banners].sort((a, b) => a.priority - b.priority)
)

// Set active banner initially based on cookies
sortedBanners.value.forEach((banner) => {
  const cookie = useSynchronizedCookie(`banner-dismissed-${banner.id}`, {
    default: () => false
  })
  if (!cookie.value && !hideAllPromoBanners.value && activeBannerId.value === null) {
    activeBannerId.value = banner.id // Set active banner if not dismissed and no other active banner
  }
})

const activeBanner = computed(() =>
  activeBannerId.value
    ? props.banners.find((banner) => banner.id === activeBannerId.value)
    : null
)

function handleDismissed(id: string) {
  hideAllPromoBanners.value = true

  // Hide the dismissed banner
  activeBannerId.value = null

  // Set dismissed cookie
  const dismissedCookie = useSynchronizedCookie<boolean>(`banner-dismissed-${id}`)
  dismissedCookie.value = true
}
</script>
