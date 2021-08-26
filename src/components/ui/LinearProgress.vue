<template>
  <progress class="linear-progress" :style="barStyle" />
</template>

<style scoped>
.linear-progress {
    display: flex;
    width: 100%;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border: none;
}

.linear-progress::-webkit-progress-bar {
    background-color: transparent;
}

/* Determinate */
.linear-progress::-webkit-progress-value {
    background-color: currentColor;
    transition: all 0.2s;
}

.linear-progress::-moz-progress-bar {
    background-color: currentColor;
    transition: all 0.2s;
}

.linear-progress::-ms-fill {
    border: none;
    background-color: currentColor;
    transition: all 0.2s;
}

/* Indeterminate */
.linear-progress:indeterminate {
    background-size: 200% 100%;
    background-image: linear-gradient(to right, transparent 50%, currentColor 50%, currentColor 60%, transparent 60%, transparent 71.5%, currentColor 71.5%, currentColor 84%, transparent 84%);
    animation: linear-progress 2s infinite linear;
}

.linear-progress:indeterminate::-moz-progress-bar {
    background-color: transparent;
}

.linear-progress:indeterminate::-ms-fill {
    animation-name: none;
}

@keyframes linear-progress {
    0% {
        background-size: 200% 100%;
        background-position: left -31.25% top 0%;
    }
    50% {
        background-size: 800% 100%;
        background-position: left -49% top 0%;
    }
    100% {
        background-size: 400% 100%;
        background-position: left -102% top 0%;
    }
}
</style>

<script>
export default {
  name: 'LinearProgress',
  props: {
    r: {
      type: Number,
      default: 33,
    },
    g: {
      type: Number,
      default: 150,
    },
    b: {
      type: Number,
      default: 243,
    },
  },
  computed: {
    barStyle() {
      const { r, g, b } = this;
      return {
        color: `rgb(${r}, ${g}, ${b})`,
        'background-color': `rgba(${r}, ${g}, ${b}, 0.25)`,
      };
    },
  },
};
</script>
