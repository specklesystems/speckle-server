<template>
  <transition v-if="shouldShowBanner" name="component-fade" mode="out-in">
    <v-alert
      v-if="!success && !errors"
      type="warning"
      dismissible
      rounded="lg"
      elevation="8"
      icon="mdi-alert"
      dense
    >
      <v-row align="center">
        <v-col class="grow">{{ verifyBannerText }}</v-col>
        <v-col class="shrink">
          <v-btn plain small :loading="loading" @click="requestVerification">
            {{ verifyBannerCtaText }}
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>
    <v-alert
      v-if="success && !errors"
      type="success"
      color="primary"
      dismissible
      rounded="lg"
      elevation="8"
      height="44"
      dense
    >
      Verification e-mail sent, please check you inbox.
    </v-alert>
    <v-alert
      v-if="errors"
      type="error"
      height="44"
      dismissible
      rounded="lg"
      elevation="8"
      dense
    >
      E-mail verification failed.{{ errorMessage ? ` Reason: ${errorMessage}` : '' }}
    </v-alert>
  </transition>
</template>
<script lang="ts">
import {
  EmailVerificationBannerStateDocument,
  RequestVerificationDocument
} from '@/graphql/generated/graphql'
import { Nullable } from '@/helpers/typeHelpers'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const { result } = useQuery(EmailVerificationBannerStateDocument)

    const user = computed(() => result.value?.activeUser || null)
    const shouldShowBanner = computed(() => {
      if (!user.value) return false
      if (user.value.verified) return false

      return true
    })
    const hasPendingVerification = computed(() => !!user.value?.hasPendingVerification)

    const verifyBannerText = computed(() =>
      hasPendingVerification.value
        ? `Please check your inbox (${user.value?.email}) for the verification e-mail`
        : `Please verify your e-mail address (${user.value?.email})`
    )

    const verifyBannerCtaText = computed(() =>
      hasPendingVerification.value ? `Re-send verification` : `Send verification`
    )

    return {
      user,
      shouldShowBanner,
      hasPendingVerification,
      verifyBannerText,
      verifyBannerCtaText
    }
  },
  data() {
    return {
      errors: false,
      success: false,
      loading: false,
      errorMessage: null as Nullable<string>
    }
  },
  methods: {
    async requestVerification() {
      const user = this.user
      if (!user) return

      this.loading = true
      const { data, errors } = await this.$apollo
        .mutate({
          mutation: RequestVerificationDocument,
          update: (cache, { data }) => {
            const isSuccess = !!data?.requestVerification
            if (!isSuccess) return

            // Switch hasPendingVerification to true
            cache.modify({
              id: cache.identify(user),
              fields: {
                hasPendingVerification: () => true
              }
            })
          }
        })
        .catch(convertThrowIntoFetchResult)
        .finally(() => (this.loading = false))

      if (errors?.length || !data?.requestVerification) {
        const errMsg = errors?.[0].message || 'An unexpected issue occurred!'

        this.errors = true
        this.errorMessage = errMsg
        this.loading = false
      } else {
        this.success = true
      }
    }
  }
})
</script>
