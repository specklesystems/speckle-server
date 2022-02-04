<template>
  <transition name="component-fade" mode="out-in">
    <v-alert
      v-if="!success & !errors"
      type="warning"
      dismissible
      rounded="lg"
      elevation="8"
      icon="mdi-alert"
      dense
    >
      <v-row align="center">
        <v-col class="grow">Your email {{ user.email }} is not verified.</v-col>
        <v-col class="shrink">
          <v-btn plain small :loading="loading" @click="requestVerification">
            Send verification
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>
    <v-alert
      v-if="success & !errors"
      type="success"
      color="primary"
      dismissible
      rounded="lg"
      elevation="8"
      height="44"
      dense
    >
      Verification email sent, please check you inbox.
    </v-alert>
    <v-alert v-if="errors" type="error" height="44" dismissible rounded="lg" elevation="8" dense>
      Email verification failed.{{ errorMessage ? ` Reason: ${errorMessage}` : '' }}
    </v-alert>
  </transition>
</template>

<script>
export default {
  props: ['user'],
  data() {
    return {
      errors: false,
      success: false,
      loading: false,
      errorMessage: null
    }
  },
  methods: {
    async requestVerification() {
      this.loading = true
      const res = await fetch(`/auth/emailverification/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('AuthToken')
        },
        body: JSON.stringify({ email: this.user.email })
      })
      if (res.status !== 200) {
        this.errors = true
        this.errorMessage = await res.text()
        this.loading = false
        return
      }

      this.success = true
      this.loading = false
    }
  }
}
</script>
