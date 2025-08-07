<template>
  <svg
    width="194"
    height="141"
    viewBox="0 0 194 141"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.585984"
      y="0.177422"
      width="136.5"
      height="102.75"
      rx="5.625"
      transform="matrix(0.948683 -0.316228 0.613941 0.789352 -0.0788556 58.8926)"
      stroke="currentColor"
      class="stroke-outline-5 fill-foundation-2"
      stroke-width="1"
    />
    <g clip-path="url(#clip0_3576_64019)">
      <path
        d="M70.4363 42.9116L88.1417 37.0098C90.1206 36.3504 92.7628 37.1509 94.0433 38.7973C95.6632 40.8796 99.0052 41.891 101.508 41.0568L114.418 36.7534C117.415 35.7544 121.418 36.9668 123.358 39.4608L145.637 68.1057C147.577 70.5996 146.72 73.4312 143.722 74.4304L83.9663 94.349C80.969 95.348 76.9669 94.1362 75.027 91.6424L52.7471 62.9968C50.8077 60.5029 51.665 57.6713 54.6621 56.6721L67.5721 52.3687C70.0749 51.5345 70.7913 49.1702 69.1719 47.0878C67.8913 45.4412 68.4574 43.5712 70.4363 42.9116Z"
        class="fill-foundation stroke-outline-5"
      />
      <circle
        cx="19.8295"
        cy="19.8295"
        r="19.3295"
        transform="matrix(0.948683 -0.316228 0.613941 0.789352 67.3623 55.084)"
        class="fill-foundation-page stroke-outline-5"
        stroke-linecap="round"
      />
      <circle
        cx="13.6085"
        cy="13.6085"
        r="13.1085"
        transform="matrix(0.948683 -0.316228 0.613941 0.789352 77.083 58.0273)"
        class="fill-foundation-2 stroke-outline-5"
        stroke-linecap="round"
      />
      <path
        d="M91.8979 58.362C88.8266 60.0023 87.9427 63.2331 89.7801 66.2917"
        class="stroke-outline-5"
        stroke-linecap="round"
      />
    </g>
    <rect
      x="0.585984"
      y="0.177422"
      width="136.5"
      height="102.75"
      rx="5.625"
      transform="matrix(0.948683 -0.316228 0.613941 0.789352 -0.0788556 43.8926)"
      stroke="currentColor"
      class="dash-moving stroke-outline-5"
      stroke-dashoffset="25"
      stroke-width="1"
      stroke-dasharray="3 4"
    />
    <defs>
      <clipPath id="clip0_3199_61388">
        <rect
          width="137.25"
          height="103.5"
          rx="6"
          transform="matrix(0.948683 -0.316228 0.613941 0.789352 0 43.6699)"
          fill="currentColor"
          class="fill-foundation"
        />
      </clipPath>
      <clipPath id="clip1_3199_61388">
        <rect
          width="63.7"
          height="63.7"
          fill="currentColor"
          class="fill-foundation"
          transform="matrix(0.948683 -0.316228 0.613941 0.789352 38.7539 60.4727)"
        />
      </clipPath>
      <clipPath id="clip2_3199_61388">
        <rect
          width="54.6"
          height="54.6"
          fill="currentColor"
          class="fill-foundation"
          transform="matrix(0.948683 -0.316228 0.613941 0.789352 66.3926 35.1069)"
        />
      </clipPath>
    </defs>
  </svg>
</template>
<style scoped>
.dash-moving {
  animation: dash 2s ease-in-out 0s 1 normal forwards running;
}

@keyframes dash {
  100% {
    stroke-dashoffset: 0;
  }
}
</style>
