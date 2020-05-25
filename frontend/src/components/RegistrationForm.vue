<template>
  <v-container>
    <v-row align='center' justify='center'>
      <v-col xs='12' md='6'>
        <v-form>
          <p>Registering a first admin user will allow you to manage this Speckle Server.</p>
          <v-text-field label='First Name' required></v-text-field>
          <v-text-field label='Last Name' required></v-text-field>
          <v-text-field label='Email' required type='email'></v-text-field>
          <v-text-field label='Password' required type='password'></v-text-field>
          <v-text-field label='Confirm Password' required type='password'></v-text-field>
          <v-btn>Submit</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  data: ( ) => ( {

  } )
}
</script>