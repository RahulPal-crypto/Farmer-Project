import api from "./api";

export const getCurrentPrice = async (commodityKey) => {
  const { data } = await api.get(`/market-prices/current/${commodityKey}`);
  return data;
};

export const getPriceHistory = async (commodityKey, days = 30) => {
  const { data } = await api.get(`/market-prices/history/${commodityKey}?days=${days}`);
  return data;
};

export const getAllPrices = async () => {
  const { data } = await api.get(`/market-prices/all`);
  return data;
};

export default { getCurrentPrice, getPriceHistory, getAllPrices };
