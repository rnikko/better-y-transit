import mapboxgl from 'mapbox-gl';

// const map = null;
let map = null;
const drawObj = {};
const markers = [];
const linestrings = {};

class MapEvents {
  static getMap() {
    return map;
  }

  static setMap(mapObject) {
    map = mapObject;
  }

  static clear(type, sourceName) {
    if (type === 'linestring') {
      let source = { sourceName: linestrings[sourceName] };

      if (sourceName === 'all') {
        source = Object.keys(linestrings);
      }

      source.forEach((key) => {
        while (linestrings[key].length > 0) {
          map.removeLayer(linestrings[key].pop());
        }
        map.removeSource(key);
        delete linestrings[key];
      });
    } else if (type === 'marker') {
      if (sourceName === 'all') {
        while (markers.length > 0) {
          const s = markers.pop();
          map.removeLayer(s);
          map.removeSource(s);
        }
      } else {
        if (markers.indexOf(sourceName) === -1) {
          return;
        }

        map.removeLayer(markers.splice(markers.indexOf(sourceName), 1)[0]);
        map.removeSource(markers.splice(markers.indexOf(sourceName), 1)[0]);
      }
    }
  }

  static setDarkTheme(on) {
    this.clear('marker', 'all');
    this.clear('linestring', 'all');

    if (on) {
      document.getElementById('app').classList.add('byt-root--theme-dark');
      map.setStyle('mapbox://styles/rnikko/ckf07oxn01jok1alloiqp2ess');
    } else {
      document.getElementById('app').classList.remove('byt-root--theme-dark');
      map.setStyle('mapbox://styles/rnikko/cke568fbn1ui219ntfu5k6u8v');
    }

    map.on('style.load', () => {
      Object.keys(drawObj).forEach((k) => {
        const type = k.split('*')[0];
        const sourceName = k.split('*')[1];
        this.draw(type, sourceName, drawObj[k]);
      });
    });
  }

  static draw(type, sourceName, features) {
    const sourceData = {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    };

    drawObj[`${type}*${sourceName}`] = features;

    if (type === 'linestring') {
      const mapStyle = map.getStyle();
      let lineShadow = '#000';
      if (mapStyle.name.indexOf('dark') >= 0) {
        lineShadow = '#FFF';
      }

      map.addSource(sourceName, sourceData);
      linestrings[sourceName] = [];

      map.addLayer({
        id: `${sourceName}-shadow-2`,
        type: 'line',
        source: sourceName,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': lineShadow, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 6, 12, 10], 'line-opacity': 0.25 },
      }, 'country-label');
      linestrings[sourceName].push(`${sourceName}-shadow-2`);

      map.addLayer({
        id: `${sourceName}-shadow-1`,
        type: 'line',
        source: sourceName,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': lineShadow, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 9, 12, 13], 'line-opacity': 0.1 },
      }, 'country-label');
      linestrings[sourceName].push(`${sourceName}-shadow-1`);

      map.addLayer({
        id: `${sourceName}-outer-color`,
        type: 'line',
        source: sourceName,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 4, 12, 8] },
      }, 'country-label');
      linestrings[sourceName].push(`${sourceName}-outer-color`);

      map.addLayer({
        id: `${sourceName}-outer-black`,
        type: 'line',
        source: sourceName,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#000', 'line-opacity': 0.7, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 4, 12, 8] },
      }, 'country-label');
      linestrings[sourceName].push(`${sourceName}-outer-black`);

      map.addLayer({
        id: `${sourceName}-inner-color`,
        type: 'line',
        source: sourceName,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, 2, 12, 6] },
      }, 'country-label');
      linestrings[sourceName].push(`${sourceName}-inner-color`);
    } else if (type === 'marker') {
      map.addSource(sourceName, sourceData);
      markers.push(sourceName);

      const circleRad = sourceName === 'termini' ? 5 : 3.5;
      const circleStrokeWidth = sourceName === 'termini' ? 2 : 1;

      map.addLayer({
        id: sourceName,
        type: 'circle',
        source: sourceName,
        paint: {
          'circle-radius': ['interpolate', ['exponential', 1.5], ['zoom'], 5, circleRad * 0.35, 12, circleRad],
          'circle-stroke-width': ['interpolate', ['exponential', 1.5], ['zoom'], 5, circleStrokeWidth * 0.35, 12, circleStrokeWidth],
          'circle-color': '#FFF',
          'circle-stroke-color': sourceName === 'termini' ? '#000' : 'rgba(0, 0, 0, 0.5)',
        },
      }, 'country-label');
    }
  }

  static fitToBounds(coords, rightSidebar) {
    const padding = {
      left: 150,
      right: 150,
      top: 150,
      bottom: 150,
    };

    if (rightSidebar) {
      padding.right += 416;
    } else {
      padding.left += 416;
    }

    const options = {
      padding,
      linear: true,
      maxZoom: 16.5,
    };

    const bounds = new mapboxgl.LngLatBounds();
    coords.forEach((c) => { bounds.extend(c); });
    map.fitBounds(bounds, options);
  }
}

export default MapEvents;
