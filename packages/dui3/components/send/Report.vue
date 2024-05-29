<template>
  <ReportConversion
    :reports="props.reports"
    @on-highlight="highlightObject"
  ></ReportConversion>
</template>

<script setup lang="ts">
import { SendConversionResult } from '~/lib/conversions/sendConversionResult'

const app = useNuxtApp()

const props = defineProps<{
  reports?: SendConversionResult[]
}>()

const highlightObject = (targetId: string) => {
  app.$baseBinding.highlightObjects([targetId])
}
</script>
