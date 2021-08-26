/* eslint no-shadow: ["error", { "allow": ["state"] }] */

import yahooTransit from '@/data/YahooTransit/';

const state = {
  darkTheme: false,
  rightSidebar: false,
  showSidebar: false,
  showAbout: false,
  location: {
    poi: null,
    error: null,
    useCurrent: false,
    geolocationSupported: true,
  },
  fetching: {
    location: false,
    suggestedPOI: false,
    results: false,
    routeLs: false,
  },
  inputs: {
    origin: null,
    via: null,
    destination: null,
  },
  suggestedPOI: {
    origin: null,
    destination: null,
    via: null,
  },
  selectedPOI: {
    origin: null,
    destination: null,
    via: null,
  },
  results: {
    requestParams: null,
    selected: null,
    routes: null,
  },
};

const getters = {
  darkTheme: () => state.darkTheme,
  rightSidebar: () => state.rightSidebar,
  showSidebar: () => state.showSidebar,
  showAbout: () => state.showAbout,
  selected: () => state.results.selected,
  location: () => state.location,
  inputs: () => state.inputs,
  fetching: () => state.fetching,
  selectedPOI: () => state.selectedPOI,
  suggestedPOI: () => state.suggestedPOI,
  routes: () => state.results.routes,
  results: () => state.results,
};

const actions = {
  async reverseGeocode({ commit }, params) {
    const { lat, lon } = params;
    commit('toggleFetching', { key: 'location', value: true });

    await yahooTransit.reverseGeocode(lat, lon)
      .then((r) => {
        commit('setReverseGeocode', { error: false, response: r });
      })
      .catch((e) => {
        commit('setReverseGeocode', { error: true, response: e.response });
      });
    commit('toggleFetching', { key: 'location', value: false });
    return state.location.poi;
  },

  async fetchSuggestions({ commit }, args) {
    const { key } = args;
    let { q } = args;

    q = q !== null && q.length === 0 ? null : q;
    if (q === null || q === '現在地') {
      return;
    }

    commit('toggleFetching', { key: 'suggestedPOI', value: true });
    const response = await yahooTransit.searchSuggest(q);
    commit('suggestions', { results: response.data.results, key });
    commit('toggleFetching', { key: 'suggestedPOI', value: false });
  },

  async fetchLinestring({ commit }, params) {
    commit('toggleFetching', { key: 'routeLs', value: true });
    await yahooTransit.searchRoutes(params)
      .then((r) => {
        commit('setLinestring', { index: params.map_coords - 1, response: r });
      });
    commit('toggleFetching', { key: 'routeLs', value: false });
  },

  async fetchRoutes({ commit }, params) {
    const hasOrigin = Object.keys(params).indexOf('f') > -1 || Object.keys(params).indexOf('fa') > -1;
    const hasDestination = Object.keys(params).indexOf('t') > -1 || Object.keys(params).indexOf('ta') > -1;

    if (!(hasOrigin && hasDestination)) {
      return;
    }

    commit('toggleFetching', { key: 'results', value: true });
    await yahooTransit.searchRoutes(params)
      .then((r) => {
        commit('setRoutes', { response: r, params });
      });
    commit('toggleFetching', { key: 'results', value: false });
  },
};

const mutations = {
  geolocationSupported: (state, value) => {
    state.location.geolocationSupported = value;
  },

  setReverseGeocode: (state, args) => {
    const { error, response } = args;
    if (error) {
      state.location.poi = null;
      state.location.useCurrent = false;
      state.location.error = response.data;
    } else {
      state.location.poi = {
        id: null,
        gid: null,
        name: '現在地',
        code: 'currentLocation',
        area: response.data.Property.Address,
        lat: parseFloat(response.data.Geometry.Coordinates.split(',')[1], 10),
        lon: parseFloat(response.data.Geometry.Coordinates.split(',')[0], 10),
      };
      state.location.useCurrent = true;
      state.location.error = null;
    }
  },

  // routes, clear selected, and request params(so we can perform linstring requests with old request params)
  setRoutes: (state, args) => {
    const { response, params } = args;
    state.results.routes = response.data.results;
    state.results.requestParams = params;
  },

  resetAll: (state) => {
    const {
      location,
      inputs,
      suggestedPOI,
      selectedPOI,
    } = state;

    location.useCurrent = false;

    inputs.origin = null;
    inputs.via = null;
    inputs.destination = null;

    suggestedPOI.origin = null;
    suggestedPOI.destination = null;
    suggestedPOI.via = null;

    selectedPOI.origin = null;
    selectedPOI.destination = null;
    selectedPOI.via = null;

    state.showSidebar = !state.showSidebar;
  },

  // set route linestring and set linestring colors from route
  setLinestring: (state, args) => {
    const { index, response } = args;
    const linestring = response.data.results;
    const route = state.results.routes[index];

    // form, set linestring features for route
    const nodes = [];
    route.legs.forEach((l, lIndex) => {
      if (l.transport.type === 'station_exit' || l.transport.type === 'walk') {
        if (lIndex === 0) {
          l.origin.lat = state.selectedPOI.origin.lat;
          l.origin.lon = state.selectedPOI.origin.lon;
        } else if (lIndex === route.legs.length - 1) {
          l.destination.lat = state.selectedPOI.destination.lat;
          l.destination.lon = state.selectedPOI.destination.lon;
        }
      }

      l.passing_stations.forEach((ps) => {
        const matchingLS = linestring.find((ls) => ps.code === ls.start_code);
        if (matchingLS !== undefined) {
          [ps.coords] = matchingLS.coords;
        }
      });

      if (l.passing_stations.length === 0) {
        nodes.push({
          start: l.origin.code,
          end: l.destination.code,
          type: l.transport.type,
          indexLeg: lIndex,
          color: l.transport.icon_color,
          bounds: [],
        });
      }

      l.passing_stations.forEach((lsb, lsbIndex) => {
        if (lsbIndex === 0) {
          nodes.push({
            start: l.origin.code,
            end: lsb.code,
            type: l.transport.type,
            indexLeg: lIndex,
            color: l.transport.icon_color,
            bounds: [],
          });
        } else {
          nodes.push({
            start: l.passing_stations[lsbIndex - 1].code,
            end: lsb.code,
            type: l.transport.type,
            indexLeg: lIndex,
            color: l.transport.icon_color,
            bounds: [],
          });
        }

        if (lsbIndex === l.passing_stations.length - 1) {
          nodes.push({
            start: lsb.code,
            end: l.destination.code,
            type: l.transport.type,
            indexLeg: lIndex,
            color: l.transport.icon_color,
            bounds: [],
          });
        }
      });
    });

    let lastLs = -1;
    const featuresLs = [];
    nodes.forEach((node) => {
      let foundStart = false;

      for (let i = 0; i < linestring.length; i += 1) {
        const ls = linestring[i];

        if (i > lastLs) {
          if (node.type !== 'line') {
            ls.coords.forEach((c) => {
              node.bounds.push(c);
            });

            featuresLs.push({
              type: 'Feature',
              properties: {
                start: node.start,
                end: node.end,
                indexLeg: node.indexLeg,
                index: i,
                color: node.color,
              },
              geometry: {
                type: 'LineString',
                coordinates: node.bounds,
              },
            });
            lastLs = i;
            break;
          }

          if (!foundStart && ls.start_code === node.start) {
            foundStart = true;
          }
          if (foundStart) {
            ls.coords.forEach((c) => {
              node.bounds.push(c);
            });
          }
          if (node.end === ls.end_code) {
            foundStart = false;
            featuresLs.push({
              type: 'Feature',
              properties: {
                start: node.start,
                end: node.end,
                indexLeg: node.indexLeg,
                index: i,
                color: node.color,
              },
              geometry: {
                type: 'LineString',
                coordinates: node.bounds,
              },
            });
            lastLs = i;
            break;
          }
        }
      }
    });

    function compare(a, b) { return a.properties.index > b.properties.index ? 1 : -1; }

    const features = {
      linestring: featuresLs.sort(compare),
      termini: [],
      paSt: [],
    };

    features.linestring.forEach((ls) => {
      let leg = route.legs[ls.properties.indexLeg];
      const coords = ls.geometry.coordinates;

      // set objects for leg-main click
      coords.forEach((c) => {
        leg.bounds.push(c);
      });

      // set objects for termini click
      if (ls.properties.target === 0) {
        features.termini.push({
          type: 'Feature',
          properties: leg,
          geometry: { type: 'Point', coordinates: coords[0] },
        });
        features.termini.push({
          type: 'Feature',
          properties: leg,
          geometry: { type: 'Point', coordinates: coords.slice(-1)[0] },
        });
      } else {
        const possibleLegs = [
          route.legs.find((l) => l.origin.code === ls.properties.start),
          route.legs.find((l) => l.destination.code === ls.properties.end),
        ];

        possibleLegs.forEach((l, li) => {
          if (l !== undefined) {
            features.termini.push({
              type: 'Feature',
              properties: l,
              geometry: {
                type: 'Point',
                coordinates: li === 0 ? coords[0] : coords.slice(-1)[0],
              },
            });
          }
        });
      }

      // first ls is paired with first leg
      // last ls is paired with last leg

      // set passing station features
      for (let i = 0; i < route.legs.length; i += 1) {
        leg = route.legs[i];
        for (let j = 0; j < leg.passing_stations.length; j += 1) {
          const passingSt = leg.passing_stations[j];
          if (passingSt.code === ls.properties.start) {
            features.paSt.push({
              type: 'Feature',
              properties: passingSt,
              geometry: {
                type: 'Point',
                coordinates: ls.geometry.coordinates[0],
              },
            });
            return;
          }
        }
      }
    });

    route.features = features;
  },

  // set selected route
  select: (state, index) => {
    state.results.selected = index;
  },

  // set route leg colors after fetching
  routeColors: (state, args) => {
    const leg = state.results.routes[args.routeIndex].legs[args.legIndex];
    leg.transport.icon_color = args.icon;
    leg.transport.text_color = args.text;
  },

  //  set results: routes, clear selected, and request params(so we can perform linstring requests with old request params)
  results: (state, args) => {
    state.results.routes = args.results;
    state.results.requestParams = args.params;
  },

  // flip origin and destination poi
  flipToFrom: (state) => {
    const { suggestedPOI, selectedPOI, inputs } = state;

    const destination = {
      input: inputs.destination,
      selected: selectedPOI.destination,
      suggested: suggestedPOI.destination,
    };

    const origin = {
      input: inputs.origin,
      selected: selectedPOI.origin,
      suggested: suggestedPOI.origin,
    };

    state.inputs.origin = destination.input;
    state.selectedPOI.origin = destination.selected;
    state.suggestedPOI.origin = destination.suggested;

    state.inputs.destination = origin.input;
    state.selectedPOI.destination = origin.selected;
    state.suggestedPOI.destination = origin.suggested;

    // clear results whenever params change
    state.results = {
      requestParams: null,
      selected: null,
      routes: null,
    };
  },

  // toggle sidebar
  toggleRightSidebar: (state, value) => {
    state.rightSidebar = value;
  },

  // toggle sidebar
  toggleDarkTheme: (state, value) => {
    state.darkTheme = value;
  },

  // toggle sidebar
  toggleSidebar: (state) => {
    state.showSidebar = !state.showSidebar;
  },

  // toggle sidebar
  toggleAbout: (state, value) => {
    state.showAbout = value;
  },

  toggleFetching: (state, args) => {
    const { key, value } = args;
    const { fetching } = state;
    if (Object.keys(fetching).indexOf(key) < 0) {
      return;
    }
    fetching[key] = value;
  },

  // set suggestedPOI value
  suggestions: (state, args) => {
    const { key, results } = args;
    state.suggestedPOI[key] = results;
  },

  // set selectedPOI for key
  selectedPOI(state, args) {
    // triggered when from PoiSuggestions component

    const { key, value } = args;

    // also change value for input
    if (key === 'origin' || key === 'via' || key === 'destination') {
      // set selected to null if not already
      state.selected = null;

      // if old value is not null and is current location, set it false
      if (state.selectedPOI[key] !== null && state.selectedPOI[key].code === 'currentLocation') {
        state.location.useCurrent = false;
      }

      //  if param is current location, set bool
      if (value !== null && value.code === 'currentLocation') {
        state.location.useCurrent = true;
      }

      // set input value to name or just whatever the user has typed so far
      state.inputs[key] = (value !== null && value.name !== undefined) ? value.name : value;
    }

    // set value
    state.selectedPOI[key] = value;

    // clear results whenever params change
    state.results = {
      requestParams: null,
      selected: null,
      routes: null,
    };
  },

  // set input params so we could display the same input text on sidebar and non-sidebar
  inputParams(state, args) {
    const { key } = args;
    let { value } = args;

    if (value === '') {
      value = null;
    }

    // // reset selected so map_coords don't get added to req query
    // if (value !== null && value.length === 0) {
    //   value = null;
    //   state.suggestedPOI[key] = null;
    // }

    // when inputs change, reset: poi, sp objects
    if (state.selectedPOI[key] !== null && state.selectedPOI[key].code === 'currentLocation') {
      state.location.useCurrent = false;
    }

    // clear search params and suggestions
    state.selectedPOI[key] = null;

    // set input value
    state.inputs[key] = value;

    // clear results whenever params change
    state.results = {
      requestParams: null,
      selected: null,
      routes: null,
    };
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
