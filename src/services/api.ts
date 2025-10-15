// Localização: client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  // Troque isso:
  // baseURL: 'http://localhost:3333',

  // Por isso:
  baseURL: import.meta.env.VITE_API_URL, 
});

export default api;