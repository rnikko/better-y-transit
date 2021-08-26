<template>
  <div class="byt-toggle" @click="toggle">
    <input class="byt-toggle__input" type="checkbox" v-model="value" />
    <label class="byt-toggle__label-wrap">
       <span class="byt-toggle__check">
          <svg width="24px" height="24px">
             <circle cx="12" cy="12" r="12" />
          </svg>
       </span>
    </label>
  </div>
</template>

<script>
export default {
  name: 'Toggle',
  props: {
    value: null,
  },
  methods: {
    toggle() {
      this.$emit('update', !this.value);
    },
  },
};
</script>
