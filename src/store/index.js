import Vue from 'vue';
import Vuex from 'vuex';
import bytStore from '@/store/bytStore';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    bytStore,
  },
});
