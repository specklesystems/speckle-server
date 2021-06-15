<template>
  <div class="d-flex align-center pa-3 admin-user-view">
    <div class="d-flex flex-grow-1 align-center">
      <img height="60pt" width="60pt" class="rounded-circle overflow-hidden elevation-1" contain :src="admin.avatar"/>
      <div class="d-flex flex-column flex-grow-1 ml-2" style="min-width: 30%">
        <span class="subtitle-1">{{ admin.name }}</span>
        <span class="caption">
          <v-icon x-small>mdi-email-outline</v-icon>
          {{ admin.email }}
          <v-tooltip right :color="admin.verified ? 'success' : 'error'" class="caption">
            <template v-slot:activator="{attrs, on}">
              <v-icon v-bind="attrs" v-on="on" small :color="admin.verified ? 'success' : 'error'">{{admin.verified ? 'mdi-check-decagram' : 'mdi-alert-decagram'}}</v-icon>
            </template>
            <span class="caption">{{admin.verified ? 'Verified' : 'Pending verification'}}</span>
          </v-tooltip>
        </span>
        <span class="caption">
          <v-icon x-small>mdi-domain</v-icon>
          {{ admin.company }}
        </span>
      </div>
      <slot name="mid"></slot>
      <div v-if="widgets" class="d-flex widget-parent">
        <div v-for="(col, index) in organizedWidgets" :key="index" class="d-flex flex-column align-content-start justify-center pr-2">
          <v-tooltip v-for="widget in col" left color="primary" :key="widget.text">
            <template v-slot:activator="{attrs, on}">
                <span v-bind="attrs"
                      v-on="on"
                      class="caption" :class="(widget.color || 'dark') + '--text'">
                  <v-icon small class="pr-1" :class="(widget.color || 'dark') + '--text'">{{widget.icon}}</v-icon>
                  <animated-number v-if="widget.type === 'number'" :value="widget.value"/>
                  <span v-else>{{ widget.value }}</span>
                </span>
            </template>
            <span class="caption">
            {{ widget.hint }}
          </span>
          </v-tooltip>
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>
<script>

import AnimatedNumber from "@/components/AnimatedNumber";
export default {
  name: "user-list-item",
  components: { AnimatedNumber },
  props: {
    admin: {},
    widgets: {},
  },
  data(){
    return {
    }
  },
  computed: {
    organizedWidgets(){
      var cols = []
      for (let i = 0; i < this.widgets.length; i+=3) {
        var row =[]
        for (let j = 0; j < 3; j++) {
          var index = i + j;
          if(index >= this.widgets.length) break;
          row.push(this.widgets[index])
        }
        cols.push(row)
      }

      return cols
    }
  }
};
</script>
<style scoped lang="scss">
.admin-user-view {
  border-bottom: 1pt dotted var(--v-background-darken1);
}
</style>
