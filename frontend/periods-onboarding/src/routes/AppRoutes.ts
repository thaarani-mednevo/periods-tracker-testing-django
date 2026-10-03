export const AppRoutes = {
  welcome: "welcome",
  onboarding: "onboarding",
  dashboard: "dashboard",
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];
