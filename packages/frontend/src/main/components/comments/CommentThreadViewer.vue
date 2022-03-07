<template>
  <div class="mt-2 pa-1 d-flex align-center" style="width: 300px">
    <div class="">
      <!-- <perfect-scrollbar style="height:100%"> -->
      <template v-for="(reply, index) in replies.slice(0, maxRepl)">
        <div v-if="index % 3 === 0" :key="index + 'date'" class="d-flex justify-center">
          <div class="d-inline px-2 py-0 caption text-center mb-2 rounded-lg background grey--text">
            {{ new Date(Date.now()).toLocaleString() }}
          </div>
        </div>
        <div
          :key="index"
          :class="`d-flex px-2 py-1 mb-2 align-center rounded-xl elevation-2 ${
            $userId() === reply.authorId ? 'primary white--text' : 'background'
          }`"
        >
          <div :class="`${$userId() === reply.authorId ? 'order-last' : ''}`">
            <user-avatar :id="reply.authorId" :size="30" />
          </div>
          <div :class="`mx-2 px-4 py-2 flex-grow-1 float-left caption`">
            {{ reply.text }}
          </div>
        </div>
      </template>
      <div class="px-0 mb-4">
        <v-textarea
          solo
          hide-details
          auto-grow
          rows="1"
          placeholder="Reply"
          class="rounded-xl mb-2 caption"
          append-icon="mdi-send"
          @click:append="timeoutEmit"
        ></v-textarea>
      </div>
      <!-- </perfect-scrollbar> -->
    </div>
  </div>
</template>
<script>
export default {
  components: {
    UserAvatar: () => import('@/main/components/common/UserAvatar')
  },
  props: {
    comment: { type: Object, default: () => null }
  },
  data: function () {
    return {
      maxRepl: 1,
      replies: [
        {
          authorId: '8ad9fd3601',
          text:
            'The translateZ() CSS function repositions an element along the z-axis in 3D space, i.e., closer to or farther away from the viewer.'
        },
        {
          authorId: '1fe2c52228',
          text:
            'One interesting aspect of a system is that we cannot apply a "divide and conquer" strategy to optimize it for its purpose. If you deal with a problem where all efforts to fix it result in counter-intuitive effects then Systems Thinking can lead to new ideas and may explain why the efforts failed.'
        },
        {
          authorId: '1fe2c52228',
          text: 'Okay, got it.'
        },
        {
          authorId: '8ad9fd3601',
          text: 'Still strange though'
        },
        {
          authorId: '1fe2c52228',
          text: 'More pasta'
        },
        {
          authorId: '1fe2c52228',
          text:
            'One interesting aspect of a system is that we cannot apply a "divide and conquer" strategy to optimize it for its purpose. If you deal with a problem where all efforts to fix it result in counter-intuitive effects then Systems Thinking can lead to new ideas and may explain why the efforts failed.'
        },
        {
          authorId: '1fe2c52228',
          text:
            'One interesting aspect of a system is that we cannot apply a "divide and conquer" strategy to optimize it for its purpose. If you deal with a problem where all efforts to fix it result in counter-intuitive effects then Systems Thinking can lead to new ideas and may explain why the efforts failed.'
        },
        {
          authorId: '1fe2c52228',
          text:
            'One interesting aspect of a system is that we cannot apply a "divide and conquer" strategy to optimize it for its purpose. If you deal with a problem where all efforts to fix it result in counter-intuitive effects then Systems Thinking can lead to new ideas and may explain why the efforts failed.'
        },
        {
          authorId: '8ad9fd3601',
          text: 'Still strange though'
        },
        {
          authorId: '1fe2c52228',
          text: 'More pasta'
        },
        {
          authorId: '8ad9fd3601',
          text: 'Still strange though'
        },
        {
          authorId: '1fe2c52228',
          text: 'More pasta'
        },
        {
          authorId: '8ad9fd3601',
          text: 'Still strange though'
        },
        {
          authorId: '1fe2c52228',
          text: 'More pasta'
        }
      ]
    }
  },
  methods: {
    timeoutEmit() {
      this.maxRepl++
      setTimeout(() => {
        this.$emit('reply-added')
      }, 100)
    }
  }
}
</script>
