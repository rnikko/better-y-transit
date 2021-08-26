<template>
  <div class="select-menu" v-click-outside="() => { showMenu = false }">
    <div class="select-menu__btn cursor-pointer" @click="showMenu = !showMenu">
      <span class="select-menu__selected-text">{{ selected.label }}</span>
      <div class="material-icons" style="line-height: 24px; font-size: 18px; margin-top: -2px">
        arrow_drop_down
      </div>
    </div>
    <div class="select-menu__options" v-if="showMenu">
      <div class="select-menu__option cursor-pointer"
        :class="{ 'select-menu__option-selected': (selected !== null && selected.value === op.value) }"
        v-for="op in options"
        :key="op.label"
        @click="selectedOp = op">
        {{ op.label }}
      </div>
    </div>
  </div>
</template>

<script>
import ClickOutside from 'vue-click-outside';

export default {
  name: 'Select',
  props: {
    selected: null,
    options: null,
  },
  directives: {
    ClickOutside,
  },
  data() {
    return {
      showMenu: false,
      selectedOp: null,
    };
  },
  watch: {
    selectedOp() {
      this.showMenu = false;
      this.$emit('set', this.selectedOp);
    },
  },
  mounted() {
    this.selectedOp = this.selected;
  },
};
</script>
