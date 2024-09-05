<template>
  <div>
    <PromoBannersBanner
      v-if="activeBanner"
      :primary-text="activeBanner.primaryText"
      :secondary-text="activeBanner.secondaryText"
      :url="activeBanner.url"
      :image="activeBanner.image"
      :is-background-image="activeBanner.isBackgroundImage"
    ></PromoBannersBanner>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { PromoBanner } from '~/lib/promo-banners/types'

const props = defineProps<{
  banners: PromoBanner[]
}>()

// Filter and sort the banners based on expiry date and priority
const activeBanner = computed(() => {
  return (
    props.banners
      .filter((banner) => {
        // Check if the banner is not expired
        const expiryDate = dayjs(banner.expiryDate, 'YYYY-MM-DD')
        return dayjs().isBefore(expiryDate)
      })
      .sort((a, b) => a.priority - b.priority)[0] || null
  ) // Return the highest priority banner or null if all are expired
})
</script>
