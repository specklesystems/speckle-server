<template>
  <span v-if="pretty">{{ tweeningValue | prettynum(value) }}</span>
  <span v-else>{{ tweeningValue }}</span>
</template>

<script>
import TWEEN from 'tween'

export default {
  name: 'AnimatedNumber',
  props: {
    value: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 1000
    },
    delay: {
      type: Number,
      default: 300
    },
    pretty: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      tweeningValue: 0
    }
  },
  watch: {
    value(oldVal, newVal) {
      this.tween(oldVal, newVal)
    }
  },
  mounted() {
    setTimeout(() => this.tween(0, this.value), this.delay)
  },
  methods: {
    tween(startValue, endValue) {
      const vm = this
      function animate() {
        if (TWEEN.update()) {
          requestAnimationFrame(animate)
        }
      }
      new TWEEN.Tween({ tweeningValue: startValue })
        .to({ tweeningValue: endValue }, this.duration)
        .easing(TWEEN.Easing.Quintic.Out)
        .onUpdate(function () {
          vm.tweeningValue = this.tweeningValue.toFixed(0)
        })
        .start()

      animate()
    }
  }
}
</script>

<style scoped></style>
