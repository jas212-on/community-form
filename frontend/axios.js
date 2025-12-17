import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://community-form-e22b.onrender.com",            
});

export default axiosInstance;