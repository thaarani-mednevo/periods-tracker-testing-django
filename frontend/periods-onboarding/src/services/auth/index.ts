import { apiRequest } from "../api/client";
import type { AuthUser } from "../../lib/auth";

export interface MeResult {
  user: AuthUser;
  onboardingCompleted: boolean;
}
export interface AuthResult extends MeResult {
  token: string;
}

export const signup = (body: { name: string; email: string; password: string }) =>
  apiRequest<AuthResult>("/api/v1/auth/signup", { method: "POST", body });

export const login = (body: { email: string; password: string }) =>
  apiRequest<AuthResult>("/api/v1/auth/login", { method: "POST", body });

export const me = () => apiRequest<MeResult>("/api/v1/auth/me");

export const logout = () => apiRequest<void>("/api/v1/auth/logout", { method: "POST" });