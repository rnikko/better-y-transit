<template>
  <div class="origin-input" :class="rightSidebar ? 'right-sidebar' : ''" v-click-outside="() => { showSuggestions = false; }">
    <div class="input-wrapper byt-row">
      <button class="button-icon-wrap" @click="toggleAbout(true)">
        <div class="button-icon material-icons">
          map
        </div>
      </button>
      <input class="input__input byt-space"
        type="text"
        @click="showSuggestions = !showSuggestions"
        placeholder="Yxxxx! Transitを検索する"
        v-model.trim="origin"/>
      <button class="button-icon-wrap" @click="setValue('origin', origin)">
        <div class="button-icon material-icons">
          search
        </div>
      </button>
    </div>
    <poi-suggestions v-if="showSuggestions" sKey="origin" @update="toggleSidebar" />
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { debounce } from 'lodash';

import ClickOutside from 'vue-click-outside';

import PoiSuggestions from '@/components/PoiSuggestions.vue';

export default {
  name: 'PanelStart',
  components: {
    PoiSuggestions,
  },
  directives: {
    ClickOutside,
  },
  data() {
    return {
      showSuggestions: false,
    };
  },
  computed: {
    ...mapGetters(['inputs', 'rightSidebar']),
    origin: {
      get() {
        return this.inputs.origin;
      },
      set(value) {
        this.setValue('origin', value.length === 0 ? null : value);
      },
    },
  },
  methods: {
    ...mapActions(['fetchSuggestions']),
    ...mapMutations(['toggleSidebar', 'toggleAbout', 'inputParams']),
    setValue(key, value) {
      // toggle suggestions panel, set input value, trigger request (debounced)
      this.inputParams({ key, value });

      this.showSuggestions = true;
      this.fetchSuggestionsDebounced({ key, q: value });
      this.showSuggestions = true;
    },
    fetchSuggestionsDebounced(args) { this.fs(this, args); },
    fs: debounce((self, args) => { self.fetchSuggestions(args); }, 500),
  },
};
</script>
