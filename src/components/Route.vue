<template>
  <div class="route">
    <div class="route__selected-line" v-if="selected === index"/>
    <div class="route__summary byt-row cursor-pointer"
      @click="onRouteClick">
      <!-- <div class="route__icon byt-col-auto material-icons">
        train
      </div> -->
      <div class="route__main byt-col">
        <div class="byt-row">
          <span>{{ formatUnixTime(data.start_time) }} — {{ formatUnixTime(data.end_time) }}</span>
          <div class="byt-space" />
          <div class="route__tags byt-row" style="margin: 1px 0 3px 0;">
            <route-tag tag="fast" v-if="data.tags.fast" />
            <route-tag tag="conv" v-if="data.tags.convenient" />
            <route-tag tag="cheap" v-if="data.tags.cheap" />
          </div>
          <div class="route__duration">{{ routeDuration }}</div>
        </div>
        <div class="route__leg-map byt-row">
          <div class="route__leg-map-leg byt-row" v-for="leg in data.legs" :key="data.legs.indexOf(leg)">
            <div class="route__leg-map-chevron material-icons"
              v-if="data.legs.indexOf(leg) !== 0">
              chevron_right
            </div>
            <div class="material-icons"
              :class="leg.transport.type === 'station_exit' ? 'flip-horiz' : ''"
              v-if="leg.transport.icon === null"
              style="margin-right: 4px; font-size: 21px"
              :style="{ 'color': `${leg.transport.icon_color}` }">
              {{ legIcon(leg.transport.type) }}
            </div>
            <img class="route__leg-map-icon" v-else :src="leg.transport.icon"/>
            <span
                class="route__leg-map-tname"
                :style="{
                'white-space': 'nowrap',
                'color': leg.transport.text_color,
                'background': leg.transport.icon_color,
                'line-height': '17px',
                'padding': '2px 4px',
                'border-radius': '2px',
                'font-weight': leg.transport.type === 'station_exit' ? '600' : '',
              }">{{ leg.transport.name }}</span>
          </div>
        </div>
        <div class="route__secondary byt-row" v-if="showMore">
          <span class="route__price">{{ formatFare(data.total_fare_yen) }} 円</span>
          <div class="route__tx-ct" v-if="data.transfers > 0">
            <span class="route__tx-ct-icon">乗換</span>
            <span>{{ data.transfers }}回</span>
          </div>
          <span class="route__price">{{ formatFare(data.distance_km) }} km</span>
          <!-- <div class="route__tags byt-row">
            <route-tag tag="fast" v-if="data.tags.fast" />
            <route-tag tag="conv" v-if="data.tags.convenient" />
            <route-tag tag="cheap" v-if="data.tags.cheap" />
          </div> -->
          <div class="byt-space" />
          <div class="route__show-legs-icon material-icons">
            {{ showLegs ? 'unfold_less' : 'unfold_more' }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="showLegs" class="route__legs">
      <div class="route__dashed-line" />
      <route-leg
        :data="leg"
        :firstStation="data.legs.indexOf(leg) === 0"
        :lastStation="data.legs.indexOf(leg) === data.legs.length - 1"
        v-for="leg in data.legs"
        :key="data.legs.indexOf(leg)"
        @station-click="mapReCenter" />
    </div>
    <linear-progress class="route__fetching-ls"
      v-if="selected === index && fetching.routeLs"
      :r="200"
      :g="200"
      :b="200"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';

import moment from 'moment';
import 'moment-timezone';

import RouteTag from '@/components/RouteTag.vue';
import RouteLeg from '@/components/RouteLeg.vue';
import LinearProgress from '@/components/ui/LinearProgress.vue';

import mapEvents from '@/data/MapEvents';

export default {
  name: 'Route',
  props: {
    data: Object,
    index: Number,
  },
  components: {
    LinearProgress,
    RouteTag,
    RouteLeg,
  },
  data() {
    return {
      showLegs: false,
      showMore: false,
    };
  },
  mounted() {
    this.showFirstRoute();
  },
  watch: {
    data() {
      // if data changes, reset show bool, and show first route
      this.showFirstRoute();
    },
    selected(newVal) {
      if (newVal === null || newVal !== this.index) {
        this.showLegs = false;
        this.showMore = false;
      }
    },
  },
  computed: {
    ...mapGetters(['selected', 'results', 'fetching', 'rightSidebar']),
    alreadySelected() {
      return this.selected === this.index;
    },
    routeDuration() {
      const hours = Math.floor(this.data.duration_min / 60);
      const minutes = this.data.duration_min % 60;

      let duration = hours === 0 ? `${minutes} 分` : `${hours} 時間`;
      if (hours > 0 && minutes > 0) {
        duration += ` ${minutes} 分`;
      }

      return duration;
    },
  },
  methods: {
    ...mapActions(['fetchLinestring']),
    ...mapMutations(['select']),
    showFirstRoute() {
      if (this.index === 0) {
        // if showing first route, simulate click on route[0]
        this.onRouteClick();
      }
    },
    async onRouteClick() {
      if (this.showMore && !this.showLegs) {
        this.showLegs = !this.showLegs;
      } else {
        this.showMore = true;
        // re-center map
      }

      if (this.alreadySelected) {
        // re-center on entire route bounds (features.linestring)
        const { selected, results } = this;
        const route = results.routes[selected];

        if (route.features === undefined) {
          return;
        }

        const coords = [];
        route.features.linestring.forEach((f) => {
          f.geometry.coordinates.forEach((c) => {
            coords.push(c);
          });
        });
        mapEvents.fitToBounds(coords, this.rightSidebar);
      } else {
        this.select(this.index);
        const { selected, results } = this;

        // clear map
        mapEvents.clear('marker', 'all');
        mapEvents.clear('linestring', 'all');

        // get route
        const route = results.routes[selected];

        if (route.features === undefined) {
          // center to leg origin-destin (then re-center to ls bounds)
          const coords = [];
          route.legs.forEach((leg) => {
            if (leg.origin.lat !== null || leg.origin.lon !== null) {
              coords.push([leg.origin.lon, leg.origin.lat]);
            }
            if (leg.destination.lat !== null || leg.destination.lon !== null) {
              coords.push([leg.destination.lon, leg.destination.lat]);
            }
          });
          mapEvents.fitToBounds(coords, this.rightSidebar);
          // draw termini markers  (no ls data)

          // clear map
          mapEvents.clear('marker', 'all');
          mapEvents.clear('linestring', 'all');

          // fetch route's linestring if not defined
          const params = JSON.parse(JSON.stringify(results.requestParams));
          params.map_coords = selected + 1;
          await this.fetchLinestring(params);
        }

        // only draw if still selected
        if (this.selected !== this.index) {
          return;
        }

        const { features } = route;
        mapEvents.draw('linestring', 'route', features.linestring);
        mapEvents.draw('marker', 'termini', features.termini);
        mapEvents.draw('marker', 'paSt', features.paSt);

        // re-center here
        const bounds = [];
        features.linestring.forEach((f) => {
          f.geometry.coordinates.forEach((c) => { bounds.push(c); });
        });
        mapEvents.fitToBounds(bounds, this.rightSidebar);
      }
    },
    mapReCenter(args) {
      const { type, data } = args;
      let bounds = [];

      if (type === 'main') {
        bounds.push([data.lon, data.lat]);
      } else if (type === 'pass') {
        bounds.push(data.coords);
      } else if (type === 'leg') {
        bounds = data.bounds;
      }

      mapEvents.fitToBounds(bounds, this.rightSidebar);
    },
    legIcon(type) {
      let icon = 'directions_transit';
      if (type === 'station_exit') {
        icon = 'transit_enterexit';
      } else if (type === 'walk') {
        icon = 'directions_walk';
      }
      return icon;
    },
    formatFare(number) {
      return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    },
    formatUnixTime(timestamp) {
      const timeUTC = moment.unix(timestamp).utc();
      const timeTokyo = timeUTC.clone().tz('Asia/Tokyo');
      return timeTokyo.format('HH:mm');
    },
  },
};
</script>
