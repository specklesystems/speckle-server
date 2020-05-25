<template>
  <v-container>
    <v-row align='center' justify='center'>
      <v-col xs='12' md='6'>
        <v-form ref="form" v-model="valid">
          <v-alert type="info" :icon='false' text>
            Since you have deployed this server, you need to register first. This will grant you admin rights and allow you to manage this server.
          </v-alert>
          <v-text-field label='First Name' v-model="firstName" required :rules="nameRules"></v-text-field>
          <v-text-field label='Last Name' v-model="lastName" required :rules="nameRules"></v-text-field>
          <v-text-field label='Email' v-model="email" required type='email' :rules="emailRules"></v-text-field>
          <v-text-field label='Password' v-model="password" required type='password'></v-text-field>
          <v-text-field label='Confirm Password' v-model="confirmPassword" required type='password'></v-text-field>
          <v-btn @click="submit">Submit</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  methods: {
    submit( ) {
      let test = this.$refs.form.validate( )
      if( !test ) return
      
    }
  },
  data: ( ) => ( {
    valid: true,
    firstName: '',
    lastName: '',
    nameRules: [
      v => !!v || 'Name is required',
      v => ( v && v.length <= 10 ) || 'Name must be less than 10 characters',
    ],
    email: '',
    emailRules: [
      v => !!v || 'E-mail is required',
      v => /.+@.+\..+/.test( v ) || 'E-mail must be valid',
    ],
  } )
}
</script>