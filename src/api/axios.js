import axios from "axios";


export const api = axios.create({
 baseURL: "http://localhost:8000/api",
 headers: {
   Accept: "application/json",
   "Content-Type": "application/json",
 },
});
api.interceptors.request.use((config) => {
 const token = sessionStorage.getItem("token");


 if (token) {
   config.headers.Authorization = `Bearer ${token}`;
 }


 return config;
});