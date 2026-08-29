import api from "@/plugins/axios";

export const get = async (url) => {
  const { data } = await api.get(url);
  return data;
};

export const post = async (url, datos, config = {}) => {
  const { data } = await api.post(url, datos, config);
  return data;
};

export const put = async (url, datos = {}, config = {}) => {
  const { data } = await api.put(url, datos, config);
  return data;
};


export const del = async (url) => {
  const { data } = await api.delete(url);
  return data;
};
