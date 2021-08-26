<template>
  <div id="app">
    <MglMap :accessToken="map.token" :mapStyle="map.style" @load="onMapLoad">
      <panel-main v-if="showSidebar" />
      <panel-start v-else />
      <transition name="fade">
        <div id="black-overmap" v-if="showAbout" @click="blackOverClick" />
      </transition>
      <transition name="slide">
        <settings-about v-if="showAbout" />
      </transition>
    </MglMap>
  </div>
</template>

<style lang="sass">
@import '@/styles/index.sass'
</style>

<script>
import { mapMutations, mapGetters } from 'vuex';
import { debounce } from 'lodash';
import { MglMap } from 'vue-mapbox';

import mapEvents from '@/data/MapEvents/';

import PanelMain from '@/components/PanelMain.vue';
import PanelStart from '@/components/PanelStart.vue';

import SettingsAbout from '@/components/SettingsAbout.vue';

export default {
  name: 'App',
  components: {
    MglMap,
    PanelMain,
    PanelStart,
    SettingsAbout,
  },
  data() {
    return {
      map: {
        token: 'pk.eyJ1Ijoicm5pa2tvIiwiYSI6ImNrbXBxNzU5azBjNDMycHBkazIxNTRiM3UifQ.wbq78pxouXke3E8McZxfsw',
        style: 'mapbox://styles/rnikko/cke568fbn1ui219ntfu5k6u8v',
      },
    };
  },
  mounted() {
    // start window resize listener
    this.$nextTick(() => {
      window.addEventListener('resize', this.onWindowResize);
      window.addEventListener('click', this.onWindowResize);
    });
    this.onWindowResize();
  },
  computed: mapGetters(['showSidebar', 'showAbout']),
  methods: {
    ...mapMutations(['toggleAbout']),
    blackOverClick() {
      if (this.showAbout) {
        this.toggleAbout(false);
      }
    },
    onWindowResize: debounce(() => {
      const routesEl = document.getElementById('routes');
      if (routesEl === null) { return; }
      const resultsEl = document.getElementById('sidebar-results');
      const sidebarHeaderEl = document.getElementById('sidebar-header');
      const sidebarWaypointsOptionsEl = document.getElementById('sidebar-waypoints-options');
      if (routesEl.clientHeight + sidebarHeaderEl.clientHeight + sidebarWaypointsOptionsEl.clientHeight >= window.innerHeight - 16) {
        resultsEl.style.height = '100vh';
      } else {
        resultsEl.style.height = 'auto';
      }
      // calculate height of results, inputs, sidebar header and see if it equals or exceeds screen height-16px
    }, 50),
    onMapLoad(event) {
      mapEvents.setMap(event.map);
    },
  },
};
</script>
