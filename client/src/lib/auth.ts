import { apiRequest } from "./queryClient";
import { LoginData } from "@/types";

export async function login(credentials: LoginData) {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json();
  
  if (data.token) {
    localStorage.setItem("auth_token", data.token);
  }
  
  return data;
}

export function logout() {
  localStorage.removeItem("auth_token");
  window.location.href = "/";
}

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*/.test(error.message);
}
