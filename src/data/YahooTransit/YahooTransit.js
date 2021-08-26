import axios from './requestor';

class YahooTransit {
  static async searchRoutes(params) {
    return axios.get('/routes', { params })
      .then((r) => r)
      .catch((e) => { throw e; });
  }

  static async searchSuggest(q) {
    return axios.get('/suggest', { params: { q } })
      .then((r) => r)
      .catch((e) => { throw e; });
  }

  static async reverseGeocode(lat, lon) {
    return axios.get('/reverse_geocode', { params: { lat, lon } })
      .then((r) => r)
      .catch((e) => { throw e; });
  }
}

export default YahooTransit;
