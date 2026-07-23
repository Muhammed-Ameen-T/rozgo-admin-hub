import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

let accessToken: string | null = null;
let tokenListeners: ((token: string | null) => void)[] = [];

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  tokenListeners.forEach((listener) => listener(token));
};

export const subscribeToTokenChanges = (listener: (token: string | null) => void) => {
  tokenListeners.push(listener);
  return () => {
    tokenListeners = tokenListeners.filter((l) => l !== listener);
  };
};

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.params && typeof config.params === "object" && config.params.filters && typeof config.params.filters === "object") {
      config.params = {
        ...config.params,
        filters: JSON.stringify(config.params.filters),
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    const newAccessToken = response.headers["x-access-token"] || response.data?.data?.accessToken;
    if (newAccessToken) {
      setAccessToken(newAccessToken);
    }
    return response;
  },
  (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }
    const { status, data } = error.response;
    // Check if the token is expired/invalid
    if (status === 401 && (data?.message === "Invalid or expired refresh token" || data?.message === "User not authenticated.")) {
      setAccessToken(null);
    }
    return Promise.reject(error);
  }
);
