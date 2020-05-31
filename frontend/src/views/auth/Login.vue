<template>
  <v-container fluid>
    <v-row style='margin-top:-10px;' dense>
      <v-col cols=12>
        <v-text-field label='your email' solo></v-text-field>
      </v-col>
      <v-col cols=12>
        <v-text-field label='password' type='password' solo style='margin-top:-22px;'></v-text-field>
        <v-btn block large color='accent' style='top:-22px;'>Log in</v-btn>
        <p class='text-center'>
          <v-btn text small block color='accent' :to='{ name: "Register", query: { appId: $route.query.appId } }' @click='state="register"'>Create Account</v-btn>
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import gql from 'graphql-tag'
import { onLogin } from '../../vue-apollo'
import debounce from 'lodash.debounce'
export default {

}
</script>