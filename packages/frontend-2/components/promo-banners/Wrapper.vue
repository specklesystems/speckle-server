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
    >
      <template #image>
        <img
          :src="activeBanner.imageSrc"
          class="h-10 sm:h-11"
          alt="banner.primaryText"
        />
      </template>
    </PromoBannersBanner>
  </div>
</template>

<script setup lang="ts">
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import dayjs from 'dayjs'

type Banner = {
  id: string
  primaryText: string
  secondaryText?: string
  url: string
  imageSrc: string
  priority: number
}

const banners = ref<Banner[]>([
  {
    id: 'speckleverse',
    primaryText: 'Join our online hackathon!',
    secondaryText: 'June 7 - 9, 2024',
    url: 'https://speckle.systems/blog/hackathon/',
    imageSrc: 'http://localhost:8081/_nuxt/assets/images/speckle_logo_big.png',
    priority: 1
  },
  {
    id: 'speckleverse1',
    primaryText: 'Join our online new hackathon!',
    secondaryText: 'June 7 sdssds- 9, 2024',
    url: 'https://speckle.systems/blog/hackathon/',
    imageSrc: 'http://localhost:8081/_nuxt/assets/images/speckle_logo_big.png',
    priority: 2
  }
])

// Don't show other promo banners until 1 day has passed since dismissing the last
const hideAllPromoBanners = useSynchronizedCookie('hide-all-promo-banners', {
  default: () => false,
  expires: dayjs().add(1, 'day').toDate()
})

const activeBanner = computed(() => {
  const sortedBanners = banners.value.sort((a, b) => a.priority - b.priority)
  for (const banner of sortedBanners) {
    const cookie = useSynchronizedCookie(`banner-dismissed-${banner.id}`, {
      default: () => false
    })
    if (!cookie.value && !hideAllPromoBanners.value) {
      return banner
    }
  }
  return null
})

function handleDismissed(id: string) {
  hideAllPromoBanners.value = true

  const index = banners.value.findIndex((banner) => banner.id === id)
  if (index !== -1) {
    banners.value.splice(index, 1) // Remove banner from active list
  }
  const dismissedCookie = useSynchronizedCookie<boolean>(`banner-dismissed-${id}`)
  dismissedCookie.value = true
}
</script>
