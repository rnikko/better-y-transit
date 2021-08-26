<template>
  <div class="byt-cb" @click="cbClick">
    <input class="byt-cb__input" type="checkbox" v-model="cbValue" />
    <label class="byt-cb__label-wrap">
       <span class="byt-cb__check">
          <svg width="12px" height="10px" viewbox="0 0 12 10">
             <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
          </svg>
       </span>
       <span class="byt-cb__label">{{ label }}</span>
    </label>
  </div>
</template>

<script>
export default {
  name: 'Checkbox',
  props: {
    label: String,
    model: Array,
    value: null,
  },
  computed: {
    valueIndex() {
      return this.model.indexOf(this.value);
    },
    cbValue: {
      get() {
        return this.valueIndex > -1;
      },
    },
  },
  methods: {
    cbClick() {
      const newModel = this.model.filter(() => true);
      if (this.cbValue) {
        newModel.splice(this.valueIndex, 1);
      } else {
        newModel.push(this.value);
      }
      this.$emit('update', newModel);
    },
  },
};
</script>
