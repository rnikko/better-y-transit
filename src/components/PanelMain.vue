<template>
  <div id="sidebar" class="byt-row" :class="rightSidebar ? 'right-sidebar' : ''">
    <div id="sidebar-header" class="byt-row">
      <button class="sidebar-btn" @click="toggleAbout(true)">
        <div class="sidebar-btn__icon material-icons">
          map
        </div>
      </button>
      <span class="sidebar-title byt-space">
        路線情報
      </span>
      <button class="sidebar-btn" @click="resetAll">
        <div class="sidebar-btn__icon material-icons">
          clear
        </div>
      </button>
    </div>
    <waypoints-options />
    <results />
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

import WaypointsOptions from '@/components/WaypointsOptions.vue';
import Results from '@/components/Results.vue';

export default {
  name: 'PanelMain',
  components: {
    WaypointsOptions,
    Results,
  },
  computed: mapGetters(['fetching', 'rightSidebar']),
  methods: mapMutations(['toggleAbout', 'resetAll']),
};
</script>
