import api from "./api";

export const fetchWeather = async (latitude, longitude) => {
  const params = {};
  if (latitude !== undefined && latitude !== null) params.latitude = latitude;
  if (longitude !== undefined && longitude !== null) params.longitude = longitude;

  const { data } = await api.get("/weather", { params });
  return data;
};

