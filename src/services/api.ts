// Localização: client/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  //comenta uma das linhas pra fazer a conexão desejada
  baseURL: 'https://gerenciador-estoque-api.onrender.com'//rodar no servidor
  //baseURL: 'http://localhost:3333' //rodar localment  
});

export default api;