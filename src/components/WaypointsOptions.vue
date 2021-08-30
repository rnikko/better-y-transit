<template>
  <div id="sidebar-waypoints-options">
    <div class="route-waypoints byt-row">
      <div class="route-waypoints__inputs byt-space">
        <!-- <div class="route_waypoints__line" /> -->
        <div class="sidebar-input byt-row">
          <div class="sidebar-input__icon material-icons">
            trip_origin
          </div>
          <input class="sidebar-input__input byt-space"
            @click="toggleSuggestions('origin')"
            v-on:keyup.enter="fetchRoutesDebounced"
            type="text"
            v-model.trim="origin"
            placeholder="出発" />
        </div>
        <div class="sidebar-input byt-row" v-if="show.viaInput">
          <div class="sidebar-input__icon via-icon material-icons">
            stop
          </div>
          <input class="sidebar-input__input byt-space"
            @click="toggleSuggestions('via')"
            v-on:keyup.enter="fetchRoutesDebounced"
            type="text"
            v-model.trim="via"
            placeholder="経由" />
        </div>
        <div class="sidebar-input byt-row">
          <div class="sidebar-input__icon material-icons">
            place
          </div>
          <input class="sidebar-input__input byt-space"
            @click="toggleSuggestions('destination')"
            v-on:keyup.enter="fetchRoutesDebounced"
            type="text"
            v-model.trim="destination"
            placeholder="到着" />
        </div>
      </div>
      <button class="route-waypoints__swap-btn sidebar-btn" @click="flipOriginDestination">
        <div class="sidebar-btn__icon material-icons">
          swap_vert
        </div>
      </button>
    </div>
    <div class="route-options-sub" v-if="show.routeOptions">
      <div class="route-options-sub__wrap">
        <div class="route-options-sub__header byt-row">
          <span>ルートのオプション</span>
          <div class="byt-space" />
          <span class="route-options-sub__close-btn cursor-pointer" @click="show.routeOptions = false">
            閉じる
          </span>
        </div>
        <div class="route-options-sub__options byt-row">
          <div class="route-options-sub-column byt-col">
            <div class="payment-options">
              <span class="transport-options__header">種別</span>
              <div class="transport-options__cb-radio-wrap">
                <radio-button
                  v-for="payment in options.payment"
                  :key="payment.value"
                  :label="payment.label"
                  :value="payment.value"
                  :model="params.payment"
                  @update="params.payment = $event" />
              </div>
            </div>
            <div class="seat-options">
              <span class="transport-options__header">座席</span>
              <div class="transport-options__cb-radio-wrap">
                <radio-button
                  v-for="seat in options.seat"
                  :key="seat.value"
                  :label="seat.label"
                  :value="seat.value"
                  :model="params.seat"
                  @update="params.seat = $event" />
              </div>
            </div>
          </div>
          <div class="route-options-sub-column byt-col">
            <div class="transport-options">
              <span class="transport-options__header">手段</span>
              <div class="transport-options__cb-radio-wrap">
                <checkbox
                  v-for="tx in options.transport"
                  :key="tx.value"
                  :label="tx.label"
                  :value="tx.value"
                  :model="params.transport"
                  @update="params.transport = $event" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="route-options-main">
      <div class="byt-row route-options-main__wrap">
        <button class="route-options__add-via-btn sidebar-btn"
          @click="show.viaInput = !show.viaInput">
          <div class="sidebar-btn__icon route-options__add-via-btn__icon material-icons">
            {{ show.viaInput ? 'clear' : 'add' }}
          </div>
        </button>
        <goog-style-select
          class="route-options__timep-select"
          @set="params.timeP = $event"
          :selected="params.timeP"
          :options="options.time" />
        <div class="byt-space" />
        <span class="route-options-sub__open-btn cursor-pointer" @click="show.routeOptions = true">
          オプションを表示
        </span>
        <div class="date-time-picker-wrap" v-if="params.timeP.value !== 'depart_now'">
          <date-time-picker @set="params.time = $event" />
        </div>
      </div>
    </div>
    <poi-suggestions class="sidebar-suggestions"
      v-if="show.suggestions"
      :sKey="suggestionsKey"
      @update="fetchRoutesDebounced" />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import { debounce } from 'lodash';

import moment from 'moment';
import 'moment-timezone';

import ClickOutside from 'vue-click-outside';

import PoiSuggestions from '@/components/PoiSuggestions.vue';

import Checkbox from '@/components/ui/Checkbox.vue';
import RadioButton from '@/components/ui/RadioButton.vue';
import DateTimePicker from '@/components/ui/DateTimePicker.vue';
import GoogStyleSelect from '@/components/ui/GoogStyleSelect.vue';

export default {
  name: 'Sidebar-Waypoints-Options',
  components: {
    GoogStyleSelect,
    DateTimePicker,
    PoiSuggestions,
    Checkbox,
    RadioButton,
  },
  directives: {
    ClickOutside,
  },
  data() {
    return {
      suggestionsKey: 'origin',
      show: {
        suggestions: false,
        viaInput: false,
        routeOptions: false,
      },
      params: {
        time: null,
        timeP: { value: 'depart_now', label: 'すぐに出発' },
        seat: 'unreserved',
        payment: 'ic',
        transport: ['shin', 'ltdexp'],
      },
      options: {
        payment: [
          { value: 'ic', label: 'ICカード優先' },
          { value: 'ticket', label: '現金（きっぷ）優先' },
        ],
        seat: [
          { value: 'unreserved', label: '自由席優先' },
          { value: 'reserved', label: '指定席優先' },
          { value: 'green', label: 'グリーン車優先' },
        ],
        time: [
          { value: 'depart_now', label: 'すぐに出発' },
          { value: 'depart_by', label: '出発時刻' },
          { value: 'arrive_by', label: '到着出発' },
          { value: 'last_train', label: '終電' },
          { value: 'first_train', label: '始発' },
        ],
        transport: [
          { value: 'plane', label: '空路' },
          { value: 'shin', label: '新幹線' },
          { value: 'ltdexp', label: '有料特急' },
          { value: 'bus', label: '路線/連絡/高速バス' },
          { value: 'ferry', label: 'フェリー' },
        ],
      },
    };
  },
  computed: {
    ...mapGetters(['inputs', 'location', 'selectedPOI', 'requestParams']),
    origin: {
      get() {
        return this.inputs.origin;
      },
      async set(value) {
        await this.setValue('origin', value);
      },
    },
    via: {
      get() {
        return this.inputs.via;
      },
      async set(value) {
        await this.setValue('via', value);
      },
    },
    destination: {
      get() {
        return this.inputs.destination;
      },
      async set(value) {
        await this.setValue('destination', value);
      },
    },
    requestParams: {
      get() {
        const { params } = this;

        const time = params.timeP.value === 'depart_now' ? moment().tz('Asia/Tokyo') : params.time;

        const requestParams = {
          time: time === null ? time : time.format('YYYY-MM-DDTHH:mm'),
          time_p: params.timeP.value,
          ic: params.payment === 'ic',
          seat: params.seat,
          shin: params.transport.indexOf('shin') > -1,
          ltdexp: params.transport.indexOf('ltdexp') > -1,
          plane: params.transport.indexOf('plane') > -1,
          bus: params.transport.indexOf('bus') > -1,
          ferry: params.transport.indexOf('ferry') > -1,
        };

        // set origin, via, destination in params
        const main = [
          { k: 'origin', q: 'f' },
          { k: 'via', q: 'via' },
          { k: 'destination', q: 't' },
        ];
        main.forEach((p) => {
          const { k, q } = p;
          const poi = this.selectedPOI[k];

          if (poi === null) {
            // skip if null
            return;
          }

          requestParams[q] = poi.code;
          if (poi.code === 'currentLocation') {
            delete requestParams[q];
            requestParams[k !== 'via' ? `${q}a` : q] = [poi.area, poi.lon, poi.lat].join(',');
          }
        });

        const hasOrigin = Object.keys(requestParams).indexOf('f') || Object.keys(requestParams).indexOf('fa');
        const hasDestination = Object.keys(requestParams).indexOf('t') || Object.keys(requestParams).indexOf('ta');

        // return null if origin or destination is not defined
        if (!hasOrigin || !hasDestination) {
          return null;
        }

        // return params if origin and destination is defined
        return requestParams;
      },
    },
  },
  watch: {
    params: {
      deep: true,
      handler() {
        this.fetchRoutesDebounced();
      },
    },
  },
  methods: {
    ...mapActions(['fetchSuggestions', 'fetchRoutes']),
    ...mapMutations(['inputParams', 'flipToFrom', 'select']),
    toggleSuggestions(newKey) {
      this.show.routeOptions = false;
      if (newKey === this.suggestionsKey) {
        // if the same as previous key, toggle show bool
        this.show.suggestions = !this.show.suggestions;
      } else {
        // if different, set new key, toggle show bool
        this.suggestionsKey = newKey;
        this.show.suggestions = true;
      }
    },
    async setValue(key, value) {
      this.show.suggestions = true;
      this.inputParams({ key, value });
      await this.fetchSuggestionsD({ key, q: value });
    },
    fetchSuggestionsD: debounce(async function f(args) {
      await this.fetchSuggestions(args);
    }, 400),
    flipOriginDestination() {
      this.flipToFrom();
      // reset selected (clears map)
      this.select(null);
      // fetches routes from new params (flipped origin, destination)
      this.fetchRoutesDebounced();
    },
    fetchRoutesDebounced: debounce(async function f() {
      this.show.suggestions = false
      // reset selected (clears map)
      this.select(null);
      // fetches routes from new params (flipped origin, destination)
      await this.fetchRoutes(this.requestParams);
    }, 300),
  },
};
</script>
