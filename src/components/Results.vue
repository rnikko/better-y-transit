<template>
  <div id="sidebar-results">
    <simplebar style="height: 100%">
      <div class="byt-row"
        v-if="fetching.results"
        style="width: 100%; padding: 12px 16px; color: #000; text-align: center; justify-content: center">
        <spinner style="margin-right: 12px; margin-left: -36px;" />
        <span style="line-height: 24px;">検索中</span>
      </div>
      <div id="routes" v-if="!fetching.results && routes !== null">
        <route :id="`route-${routes.indexOf(route)}`"
          :index="routes.indexOf(route)"
          :data="route"
          v-for="route in routes"
          :key="routes.indexOf(route)" />
      </div>
    </simplebar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import simplebar from 'simplebar-vue';
import 'simplebar/dist/simplebar.min.css';

import * as Vibrant from 'node-vibrant';
import invert from 'invert-color';

import Route from '@/components/Route.vue';
import Spinner from '@/components/ui/Spinner.vue';

export default {
  name: 'Results',
  components: {
    simplebar,
    Route,
    Spinner,
  },
  data() {
    return {
      colors: {
        station_exit: '#eacb00',
        徒歩: '#787878',
      },
    };
  },
  computed: {
    ...mapGetters(['routes', 'fetching']),
    showRoutesEl() {
      const { fetching, routes } = this;
      return !fetching.results && routes !== null;
    },
  },
  watch: {
    showRoutesEl(value) {
      if (value === false) {
        const resultsEl = document.getElementById('sidebar-results');
        resultsEl.style.height = 'auto';
      } else {
        setTimeout(() => { this.fixScrollbar(); }, 200);
      }
    },
    routes(value) {
      this.getColors(value);
    },
  },
  methods: {
    // move this to a misc-utils file
    fixScrollbar() {
      const resultsEl = document.getElementById('sidebar-results');
      const routesEl = document.getElementById('routes');
      const sidebarHeaderEl = document.getElementById('sidebar-header');
      const sidebarWaypointsOptionsEl = document.getElementById('sidebar-waypoints-options');

      if (routesEl.clientHeight + sidebarHeaderEl.clientHeight + sidebarWaypointsOptionsEl.clientHeight >= window.innerHeight - 16) {
        resultsEl.style.height = '100vh';
      } else {
        resultsEl.style.height = 'auto';
      }
    },
    getColors(routes) {
      if (routes === null) {
        return;
      }

      routes.forEach((route, routeIndex) => {
        route.legs.forEach((leg, legIndex) => {
          if (leg.transport.icon !== null) {
            const opts = { colorCount: 8 };
            const v = new Vibrant(`${process.env.VUE_APP_API_BASE}/cors-proxy?url=${leg.transport.icon}`, opts);
            v.getPalette()
              .then((palette) => {
                const swatch = palette.DarkVibrant.population > palette.Vibrant.population ? palette.DarkVibrant : palette.Vibrant;
                const icon = swatch.hex;
                const text = invert(icon, { black: '#000', white: '#fff', threshold: 0.5 });
                this.$store.commit('routeColors', {
                  routeIndex, legIndex, icon, text,
                });
              });
          } else {
            let icon = this.colors[leg.transport.type === 'station_exit' ? 'station_exit' : leg.transport.name];
            if (icon === undefined) { icon = leg.transport.icon_color; }
            const text = invert(icon, { black: '#000', white: '#fff', threshold: 0.5 });
            this.$store.commit('routeColors', {
              routeIndex, legIndex, icon, text,
            });
          }
        });
      });
    },
  },
};
</script>
