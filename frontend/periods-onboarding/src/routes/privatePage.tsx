import type { ReactNode } from "react";

interface PrivatePageProps {
  children?: ReactNode;
}

// Wraps routes that need login (dashboard).
// TODO: once auth is wired in, redirect to AppRoutes.welcome (or a login
// route) if there's no session, same pattern as RequireAuth in the main app.
export const PrivatePage = ({ children }: PrivatePageProps) => {
  return <>{children || null}</>;
};
