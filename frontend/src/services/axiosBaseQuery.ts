import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import axios, { type AxiosRequestConfig } from "axios";
import type { ApiError } from "../types/order";

export interface AxiosQueryArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  params?: AxiosRequestConfig["params"];
  data?: AxiosRequestConfig["data"];
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

const isErrorBody = (value: unknown): value is ErrorBody =>
  typeof value === "object" && value !== null && "error" in value;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 15_000,
});

export const toApiError = (error: unknown): ApiError => {
  if (axios.isCancel(error)) {
    return { status: "ABORTED", code: "ABORTED", message: "Request was cancelled." };
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        status: "NETWORK_ERROR",
        code: error.code ?? "NETWORK_ERROR",
        message: "Could not reach the server. Check your connection and try again.",
      };
    }

    const body: unknown = error.response.data;
    const details = isErrorBody(body) ? body.error : undefined;

    return {
      status: error.response.status,
      code: details?.code ?? "HTTP_ERROR",
      message: details?.message ?? `Request failed with status ${error.response.status}.`,
    };
  }

  return { status: "NETWORK_ERROR", code: "UNKNOWN", message: "Something went wrong." };
};

export const axiosBaseQuery =
  (): BaseQueryFn<AxiosQueryArgs, unknown, ApiError> =>
  async ({ url, method = "GET", params, data }, { signal }) => {
    try {
      const response = await apiClient.request({ url, method, params, data, signal });
      return { data: response.data };
    } catch (error) {
      return { error: toApiError(error) };
    }
  };
