<template>
  <span class="ellipsis-anim ml-1 mr-3 primary--text" style="position: absolute">
    <span>.</span>
    <span>.</span>
    <span>.</span>
  </span>
</template>
<style scoped>
.ellipsis-anim span {
  font-family: serif !important;
  opacity: 0;
  -webkit-animation: ellipsis-dot 1s infinite;
  animation: ellipsis-dot 1s infinite;
  font-size: 3em;
  line-height: 10px;
  user-select: none;
}

.ellipsis-anim span:nth-child(1) {
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
  margin-right: -5px;
}
.ellipsis-anim span:nth-child(2) {
  -webkit-animation-delay: 0.1s;
  animation-delay: 0.1s;
  margin-right: -5px;
}
.ellipsis-anim span:nth-child(3) {
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
  margin-right: -5px;
}

@-webkit-keyframes ellipsis-dot {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes ellipsis-dot {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
