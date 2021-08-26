<template>
  <div class="leg">
    <div class="leg__line-color" :style="{'border-color': `${data.transport.icon_color}`}" />
    <div class="byt-row cursor-pointer" @click="onStationClick('main', data.origin)">
      <div class="leg__station-time byt-col-auto" :class="data.depart_time === null ? 'hide-text' : ''">
        {{ formatUnixTime(data.depart_time) }}
      </div>
      <div class="leg__stop-circle" :class="darkTheme ? 'leg__stop-circle-dark' : ''" />
      <div class="leg__station-name byt-col" :style="!firstStation ? { 'position': 'relative', 'top': '-12px' } : ''">
        {{ data.origin.name }}
      </div>
    </div>
    <div class="leg__summary byt-row">
      <div class="leg__icon cursor-pointer" @click="onStationClick('leg', data)">
        <div
          class="material-icons"
          v-if="data.transport.icon === null"
          :style="{ 'color': data.transport.type === 'line' ? `${data.transport.icon_color}` : 'rgba(0, 0, 0, 0.54)' }">
          {{ legIcon(data.transport.type) }}
        </div>
        <img v-else :src="data.transport.icon" />
      </div>
      <div class="leg__inner">
        <div class="leg__inner-top cursor-pointer" @click="onStationClick('leg', data)">
          <span class="leg__transport-name"
            :style="{
              'color': data.transport.text_color,
              'background': data.transport.icon_color,
              'font-weight': data.transport.type === 'station_exit' ? '600' : '',
            }">{{ data.transport.name }}</span>
          <span class="leg__transport-dir">
            {{ data.transport.direction }}
          </span>
        </div>
        <div class="leg__inner-bot byt-row">
          <div class="leg__show-stops-icon material-icons cursor-pointer"
            @click="showStops = !showStops"
            v-if="data.passing_stations.length > 0">
            {{ showStops ? 'expand_less' : 'expand_more' }}
          </div>
          <span class="leg__duration">
            {{ timeBetween(data.depart_time, data.arrive_time) }}
          </span>
          <span class="leg__station-ct">
            {{ data.passing_stations.length > 0 ? `(${data.passing_stations.length + 1} 駅)` : '' }}
          </span>
          <div class="leg__platform"
            v-if="data.origin.platform !== null && legIcon(data.transport.type) !== 'directions_walk'">
            <span class="leg__platform-num">{{ data.origin.platform }}</span>
            <span class="leg__platform-text">番線発</span>
          </div>
          <!-- <div class="leg__platform"
            v-if="data.destination.platform !== null" style="margin-left: 16px;">
            <span class="leg__platform-num">{{ data.destination.platform }}</span>
            <span class="leg__platform-text">番線着</span>
          </div> -->
        </div>
      </div>
    </div>
    <div v-if="showStops" style="margin-bottom: 12px" :style="{'border-color': `${data.transport.icon_color}`}">
      <div class="leg__passing-station byt-row cursor-pointer"
        @click="onStationClick('pass', station)"
        v-for="station in data.passing_stations"
        :key="data.passing_stations.indexOf(station)">
        <span class="leg__passing-station-time">{{ formatUnixTime(station.time) }}</span>
        <div class="leg__stop-circle" :class="darkTheme ? 'leg__stop-circle-dark' : ''" :style="{'border-color': `${data.transport.icon_color}`}"/>
        <span class="leg__passing-station-name">{{ station.name }}</span>
      </div>
    </div>
    <div class="byt-row cursor-pointer" @click="onStationClick('main', data.destination)">
      <div class="leg__station-time byt-col-auto" :class="data.arrive_time === null ? 'hide-opacity' : ''">
        {{ formatUnixTime(data.arrive_time) }}
      </div>
      <div class="leg__stop-circle" :class="darkTheme ? 'leg__stop-circle-dark' : ''" />
      <div class="leg__station-name byt-col " v-if="lastStation">
        {{ data.destination.name }}
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import 'moment-timezone';
import { mapGetters } from 'vuex';

export default {
  name: 'RouteLeg',
  props: {
    data: Object,
    firstStation: Boolean,
    lastStation: Boolean,
  },
  data() {
    return {
      showStops: false,
    };
  },
  computed: mapGetters(['darkTheme']),
  methods: {
    onStationClick(type, data) {
      this.$emit('station-click', { type, data });
    },
    legIcon(type) {
      let icon = 'directions_transit';
      if (type === 'walk' || type === 'station_exit') {
        icon = 'directions_walk';
      } else if (type === 'flight') {
        icon = 'flight';
      }
      return icon;
    },
    formatUnixTime(timestamp) {
      if (timestamp === null) {
        return '_';
      }

      const timeUTC = moment.unix(timestamp).utc();
      const timeTokyo = timeUTC.clone().tz('Asia/Tokyo');
      return timeTokyo.format('HH:mm');
    },
    timeBetween(start, end) {
      const startTime = moment.unix(start).utc();
      const endTime = moment.unix(end).utc();
      const duration = moment.duration(endTime.diff(startTime));

      const hours = duration.hours() + duration.days() * 24;

      let text = `${duration.minutes()} 分`;
      if (hours > 0 && hours < 24) {
        text = `${hours} 時間`;
        if (duration.minutes() > 0) {
          text += ` ${duration.minutes()} 分`;
        }
      }
      return text;
    },
  },
};
</script>
