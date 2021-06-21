<template lang="html">
  <router-view></router-view>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {},
  apollo: {
    serverInfo: {
      query: gql`
        query {
          serverInfo {
            name
            company
            description
            adminContact
          }
        }
      `
    }
  }
}
</script>
<style lang="scss">
.marked-preview h1 {
  padding-bottom: 10px;
  padding-top: 10px;
}

.marked-preview h2 {
  padding-bottom: 7px;
  padding-top: 7px;
}

.marked-preview h3 {
  padding-bottom: 5px;
  padding-top: 5px;
}

.marked-preview hr {
  margin-top: 10px;
  margin-bottom: 10px;
}

.no-active::before {
  background-color: transparent !important;
}

.v-card__text,
.v-card__title {
  word-break: normal !important;
}

/*.v-application code {
  background-color: #969696;
  color: #171717;
  padding: 0 0.4rem;
}*/

/* TOOLTIPs */

.tooltip {
  display: block !important;
  z-index: 10000;
  font-family: 'Roboto', sans-serif !important;
  font-size: 0.75rem !important;
}

.tooltip .tooltip-inner {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 16px;
  padding: 5px 10px 4px;
}

.tooltip .tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.tooltip[x-placement^='top'] {
  margin-bottom: 5px;
}

.tooltip[x-placement^='top'] .tooltip-arrow {
  border-width: 5px 5px 0 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^='bottom'] {
  margin-top: 5px;
}

.tooltip[x-placement^='bottom'] .tooltip-arrow {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^='right'] {
  margin-left: 5px;
}

.tooltip[x-placement^='right'] .tooltip-arrow {
  border-width: 5px 5px 5px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[x-placement^='left'] {
  margin-right: 5px;
}

.tooltip[x-placement^='left'] .tooltip-arrow {
  border-width: 5px 0 5px 5px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip.popover .popover-inner {
  background: #f9f9f9;
  color: black;
  padding: 24px;
  border-radius: 5px;
  box-shadow: 0 5px 30px rgba(black, 0.1);
}

.tooltip.popover .popover-arrow {
  border-color: #f9f9f9;
}

.tooltip[aria-hidden='true'] {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s, visibility 0.15s;
}

.tooltip[aria-hidden='false'] {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.15s;
}

.speckle-gradient-bg {
  @include speckle-gradient-bg;
}

.speckle-gradient-txt {
  @include speckle-gradient-txt;
}
</style>
