import axios from 'axios';

const BASE_URL = process.env.VUE_APP_API_BASE

axios.interceptors.request.use(
  (request) => {
    const path = request.url;
    request.url = `${BASE_URL}${path}`;
    return request;
  },
);
axios.interceptors.response.use(
  (response) => response,
);

export default axios;
