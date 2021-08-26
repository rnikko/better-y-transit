<template>
  <div id="about-settings" :class="rightSidebar ? 'right-sidebar-settings' : ''">
    <div class="about-settings-header byt-row" style="border-bottom: 1px solid #d9d9d9;">
      <span style="line-height: 32px; font-weight: 500">no logo lol</span>
      <div class="byt-space" />
      <button class="button-icon-wrap" @click="toggleAbout(false)" style="margin: 0px;">
        <div class="button-icon material-icons">
          keyboard_arrow_up
        </div>
      </button>
    </div>
    <div class="settings-toggles" style="padding: 6px 0; border-bottom: 1px solid #d9d9d9;">
      <div class="byt-row toggle" style="padding: 12px 20px;">
        <div class="material-icons" style="color: var(--color-icon-base); font-size: 24px; margin-right: 20px; color: var(--color-text-alt);">
          brightness_medium
        </div>
        <span style="line-height: 24px; font-family: Arial; font-size: 14px; display: block">ダークテーマ: {{ darkTheme ? 'オン' : 'オフ' }}</span>
        <div class="byt-space"></div>
        <toggle
          :value="darkTheme"
          @update="toggleDarkTheme($event)" />
      </div>
      <div class="byt-row toggle" style="padding: 12px 20px;">
        <div class="material-icons" style="color: var(--color-icon-base); font-size: 24px; margin-right: 20px; color: var(--color-text-alt); transform: rotate(270deg);">
          vertical_align_bottom
        </div>
        <span style="line-height: 24px; font-family: Arial; font-size: 14px; display: block">右サイドバー: {{ rightSidebar ? 'オン' : 'オフ' }}</span>
        <div class="byt-space"></div>
        <toggle
          :value="rightSidebar"
          @update="toggleRightSidebar($event)" />
      </div>
    </div>
    <div class="about" style="padding: 4px 0;">
      <div class="byt-row" style="margin: 12px 20px;">
        <img src="https://avatars3.githubusercontent.com/u/36778844?s=460&u=53ee24a4d3a7ec675cb849712f91272dcdf92719&v=4" style="height: 42px; width: 42px; border-radius: 50%; border: 2px solid rgba(127, 127, 127, 0.8)" />
        <div class="byt-col-auto" style="padding-left: 12px; display: block">
          <span style="display: block; line-height: 28px; font-size: 15.2px; font-weight: 600">
            著 raphael m
          </span>
          <div style="height: 21px; font-size: 14px; font-weight: 500;">
            <a href="https://github.com/rnikko" style="color: #3CA0F5;">Github</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import Toggle from '@/components/ui/Toggle.vue';

import mapEvents from '@/data/MapEvents/';

import ClickOutside from 'vue-click-outside';

export default {
  name: 'SettingsAbout',
  components: {
    Toggle,
  },
  directives: {
    ClickOutside,
  },
  methods: mapMutations(['toggleAbout', 'toggleRightSidebar', 'toggleDarkTheme']),
  computed: mapGetters(['showAbout', 'rightSidebar', 'darkTheme']),
  watch: {
    darkTheme(value) {
      mapEvents.setDarkTheme(value);
    },
  },
};
</script>
