<template>
  <div class="byt-radio">
    <label class="byt-radio__label-wrap">
      <input class="byt-radio__input" type="radio" :value="value" v-model="radioValue" />
      <span class="byt-radio__circle" />
      <span class="byt-radio__label">{{ label }}</span>
    </label>
  </div>
</template>

<script>
export default {
  name: 'RadioButton',
  props: {
    label: String,
    value: null,
    model: null,
  },
  computed: {
    radioValue: {
      get() {
        return this.model;
      },
      set() {
        this.$emit('update', this.value);
      },
    },
  },
};
</script>
