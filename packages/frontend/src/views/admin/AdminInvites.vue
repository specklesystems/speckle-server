<template>
  <v-card>
    <h2>Send invite to multiple people.</h2>
    <v-combobox v-model="chips" label="Emails" deletable-chips solo :rules="emailRules" multiple>
      <template #selection="data">
        <v-chip :input-value="data.selected" close @click:close="remove(data.item)">
          {{ data.item }}
        </v-chip>
      </template>
    </v-combobox>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      chips: [],
      emailRules: [
        (inputValules) => {
          console.log(inputValules)
          let errors = ''
          if (!inputValules || inputValules.length < 1) return 'Add emails'
          else {
            inputValules.forEach((input) => {
              if (
                !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,24}))$/.test(
                  input
                )
              )
                errors.concat(`${input} is not a valid email, `)
            })
            console.log(errors)
            return errors ? errors : true
          }
        }
      ]
    }
  },

  methods: {
    remove(item) {
      console.log(item)
      this.chips.splice(this.chips.indexOf(item), 1)
    }
  }
}
</script>
