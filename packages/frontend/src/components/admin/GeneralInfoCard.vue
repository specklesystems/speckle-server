<template>
  <admin-card title="Info" v-bind="$attrs">
    <div class="d-flex justify-space-around">
      <div v-for="(value, name) in totalData" class="flex-grow-1">
        <h4 class="primary--text text--lighten-2 text-center">
          Total {{ name }} </h4>
        <v-tooltip bottom color="primary" :disabled="value < 1000">
          <template v-slot:activator="{ on, attrs }">
            <p class="primary--text text-h3 text-md-h2 text-lg-h1 text-center" v-bind="attrs" v-on="on">
              <animated-number :value="value"/>
            </p>
          </template>
          <span>{{ value }}</span>
        </v-tooltip>
      </div>
    </div>
  </admin-card>
</template>

<script>
import AdminCard from "@/components/admin/AdminCard";
import AnimatedNumber from "@/components/AnimatedNumber";

export default {
  name: "GeneralInfoCard",
  components: { AnimatedNumber, AdminCard },
  data() {
    return {
      totalData: {
        users: 435,
        streams: 1123,
        commits: 55460
      }
    };
  }
};
</script>

<style scoped>

</style>
