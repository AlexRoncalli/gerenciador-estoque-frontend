// Localização: client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  //         👇👇👇 CORRIJA ESTA LINHA 👇👇👇
  baseURL: 'https://gerenciador-estoque-api.onrender.com'
});

export default api;