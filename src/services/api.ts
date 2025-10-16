// Localização: client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  
  baseURL: 'https://gerenciador-estoque-api.onrender.com'
});

export default api;