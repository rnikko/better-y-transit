<template>
  <div class="suggestions">
    <simplebar :data-simplebar-auto-hide="autoHide" style="max-height: 240px">
      <div class="suggestions__location byt-row"
        v-if="showGeoLocation"
        @click="locationP.onClick"
        :style="{ 'cursor': `${locationP.cursor}` }">
        <spinner class="suggestions__spinner"
          v-if="locationP.icon === 'spinner'"
          style="margin: 0; margin-right: 16px"
          :style="{ 'border-color': `${locationP.color}` }" />
        <div class="material-icons"
          v-else
          style="margin-right: 16px; font-size: 24px;"
          :style="{ 'color': `${locationP.color}` }">
          {{ locationP.icon }}
        </div>
        <span style="display: inline-block; font-size: 14px; line-height: 24px;">{{ locationP.text }}</span>
      </div>
      <div v-if="!fetching.suggestedPOI">
        <div v-if="hasResults">
          <div class="suggestion byt-row cursor-pointer"
            :class="s === selectedPOI[key] ? 'suggestion__selected' : ''"
            @click="onSuggestClick({ key: key, value: s })"
            v-for="s in suggestions"
            :key="s.code">
            <div class="byt-col-auto" style="margin-right: 16px;">
              <div class="poi-icon material-icons">
                train
              </div>
            </div>
            <div class="byt-col">
              <span class="name">{{ s.name }}</span>
              <span class="area">{{ s.area }}</span>
            </div>
          </div>
        </div>
        <div v-if="noInput || !hasResults" class="suggestions__note">
          <span>{{ noInput ? '駅名を入力してください' : '一致する検索結果はありませんでした' }}</span>
        </div>
      </div>
      <div v-if="fetching.suggestedPOI" class="suggestions__note">
        <spinner class="suggestions__spinner" />
        <span>検索中</span>
      </div>
    </simplebar>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';

import simplebar from 'simplebar-vue';
import 'simplebar/dist/simplebar.min.css';

import Spinner from '@/components/ui/Spinner.vue';

export default {
  name: 'PoiSuggestions',
  props: {
    autoHide: Boolean,
    sidebar: Boolean,
    sKey: String,
  },
  components: {
    simplebar,
    Spinner,
  },
  computed: {
    ...mapGetters(['suggestedPOI', 'location', 'selectedPOI', 'showSidebar', 'fetching']),
    key() { return this.sKey; },
    supported() {
      return this.location.geolocationSupported;
    },
    hasLocData() {
      return this.location.poi !== null;
    },
    noInput() {
      return this.suggestedPOI[this.key] === null;
    },
    hasResults() {
      return !(this.noInput || this.suggestedPOI[this.key].length === 0);
    },
    showGeoLocation() {
      const { key } = this;
      const paramCurrentLoc = this.location.useCurrent && this.selectedPOI[key] !== null && this.selectedPOI[key].code === 'currentLocation';
      if (!this.showSidebar || paramCurrentLoc || !this.location.useCurrent) {
        return true;
      }
      return false;
    },
    suggestions() {
      const { key } = this;
      const selectedCodes = [];
      Object.keys(this.selectedPOI).forEach((k) => {
        if (k === key) {
          return;
        }
        const v = this.selectedPOI[k];
        if (v === null) {
          return;
        }
        selectedCodes.push(v.code);
      });

      const suggested = this.suggestedPOI;

      if (suggested[key] === null) {
        return null;
      }

      return suggested[key].filter((poi) => selectedCodes.indexOf(poi.code) < 0);
    },
    locationP() {
      const {
        key,
        location,
        supported,
        hasLocData,
      } = this;

      let text = '現在地';
      let icon = 'gps_not_fixed';
      let color = 'var(--color-text-base)';
      let cursor = 'pointer';
      let onClick = () => { this.toggleLocation(); };

      if (location.error !== null) {
        if (location.error.type === 'region_unsupported') {
          text = '予期しないエラーが発生しました';
        } else {
          text = `地域では利用できません (${location.error.region}) `;
        }
        icon = 'warning';
        color = '#F00';
        cursor = 'not-allowed';
        onClick = () => {};
      } else if (this.fetching.location) {
        text = '位置情報を取得しています';
        icon = 'spinner';
        color = 'var(--color-text-base)';
        cursor = 'default';
        onClick = () => {};
      } else if (hasLocData && supported && location.useCurrent) {
        icon = 'gps_fixed';
        color = '#1e88e5';
        cursor = 'pointer';
        onClick = () => {
          this.setSelectedPOI({ key, value: null });
        };
      } else if (hasLocData && supported && !location.useCurrent) {
        icon = 'gps_fixed';
        color = 'var(--color-text-base)';
        cursor = 'pointer';
        onClick = () => {
          this.setSelectedPOI({ key, value: this.location.poi });
          this.$emit('update');
        };
      } else if (!supported) {
        text = '位置情報の利用が許可されていません';
        icon = 'gps_off';
        color = 'var(--color-text-base)';
        cursor = 'not-allowed';
        onClick = () => {};
      }

      return {
        text,
        icon,
        color,
        cursor,
        onClick,
      };
    },
  },
  methods: {
    ...mapActions(['reverseGeocode']),
    ...mapMutations({
      setInputParams: 'inputParams',
      setSelectedPOI: 'selectedPOI',
      geolocationSupported: 'geolocationSupported',
    }),
    async toggleLocation() {
      const { key } = this;
      await navigator.geolocation.getCurrentPosition(
        async (position) => {
          const params = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          const value = await this.reverseGeocode(params);
          if (value !== null) {
            this.setSelectedPOI({ key, value });
          }
        }, () => {
          this.geolocationSupported(false);
        },
      );
      this.$emit('update');
    },
    onSuggestClick(params) {
      const { key, value } = params;
      // this.setInputParams({ key, value: value.name });
      this.setSelectedPOI({ key, value });
      this.$emit('update');
    },
  },
};
</script>
