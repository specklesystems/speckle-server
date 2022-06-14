<template>
  <v-theme-provider v-show="items" :dark="isDarkTheme" :light="!isDarkTheme">
    <v-card class="mention-list">
      <v-card-text class="pa-0 px-2">
        <v-list dense>
          <template v-if="items && items.length">
            <v-list-item-group v-model="selectedIndex">
              <v-list-item
                v-for="(item, index) in items"
                :key="item.id"
                class="mention-list__item"
                @click="selectItem(index)"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    <span class="d-block text-body-2 font-weight-bold">
                      {{ item.name }}
                    </span>
                    <template v-if="item.company">
                      <span class="d-block text-caption">{{ item.company }}</span>
                    </template>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </template>
          <v-list-item v-else class="mention-list__empty">
            Couldn't find anything 🤷
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-theme-provider>
</template>

<script>
import { isDarkTheme } from '@/main/utils/themeStateManager'

export default {
  name: 'SmartTextEditorMentionList',
  props: {
    items: {
      type: Array,
      default: undefined
    },
    command: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      selectedIndex: 0
    }
  },
  computed: {
    isDarkTheme() {
      return isDarkTheme()
    }
  },
  watch: {
    items() {
      this.selectedIndex = 0
    }
  },
  methods: {
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') {
        this.upHandler()
        return true
      }
      if (event.key === 'ArrowDown') {
        this.downHandler()
        return true
      }
      if (event.key === 'Enter') {
        this.enterHandler()
        return true
      }
      return false
    },
    upHandler() {
      if (!this.items) return

      this.selectedIndex =
        (this.selectedIndex + this.items.length - 1) % this.items.length
    },
    downHandler() {
      if (!this.items) return

      this.selectedIndex = (this.selectedIndex + 1) % this.items.length
    },
    enterHandler() {
      if (!this.items) return

      this.selectItem(this.selectedIndex)
    },
    selectItem(index) {
      if (!this.items) return

      const item = this.items[index]
      if (item) {
        this.command({ id: item.id, label: item.name })
      }
    }
  }
}
</script>

<style scoped lang="scss">
.mention-list {
  z-index: 10000; // same as tooltips
}
</style>
