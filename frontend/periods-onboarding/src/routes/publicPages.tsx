import type { ReactNode } from "react";

interface PublicPageProps {
  children?: ReactNode;
}

// Wraps routes that don't need login (welcome, onboarding flow itself).
// Later, when auth is wired in, this can redirect an already-logged-in
// user away from these pages if needed.
export const PublicPage = ({ children }: PublicPageProps) => {
  return <>{children || null}</>;
};
