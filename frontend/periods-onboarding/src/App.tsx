import { Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "./Features/dashboard/Dashboard";
import { LogPeriodPage } from "./Features/dashboard/LogPeriodPage";
import { CalendarPage } from "./Features/calendar/CalendarPage";
import { PhaseDailyLog } from "./Features/phases/PhaseDailyLog";
import { PhaseSettings } from "./Features/phases/PhaseSettings";
import { TrendsPage } from "./Features/dashboard/TrendsPage";
import { OnboardingLayout, PrivacyPill } from "./Composites/onboardingLayout/OnboardingLayout";
import { WelcomePage } from "./Features/welcomePage/WelcomePage";
import { startNewDevPatient } from "./lib/devPatient";
import { clearProgress, loadProgress, type OnboardingProgress } from "./lib/progress";
import { OnboardingFlow } from "./Features/onboardingFlow/OnboardingFlow";
import { submitOnboardingProfile } from "./services/onboarding";
import type { OnboardingData, StepId } from "./types";
import { INITIAL_DATA } from "./constants";
import { LoginPage, SignupPage } from "./Features/auth/AuthPages";
import { clearAuth, getAuth, saveAuth } from "./lib/auth";
import { logout, me, type AuthResult } from "./services/auth";
import { getProfile } from "./services/settings";

export type View =
  | { name: "welcome" }
  | { name: "onboarding"; data?: OnboardingData; step?: StepId; completed?: readonly StepId[] }
  | { name: "dashboard"; data: OnboardingData; day?: string }
  | { name: "log"; data: OnboardingData }
  | { name: "daily-log"; data: OnboardingData; day?: string }
  | { name: "calendar"; data: OnboardingData }
  | { name: "settings"; data: OnboardingData }
  | { name: "trends"; data: OnboardingData }
  | { name: "login" }
  | { name: "signup" };

export default function App() {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && window.history.state?.name) {
      return window.history.state as View;
    }
        return getAuth() ? { name: "welcome" } : { name: "login" };
  });

  // Read once on mount. The welcome page stays in control — nothing auto-jumps into the flow.
  const [progress, setProgress] = useState<OnboardingProgress | null>(() => loadProgress());
  const [auth, setAuthState] = useState(() => getAuth());

  // Calendar / Daily Log-la select panna date. Ellaa pages-um idhaiye use pannum.
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);

  const open = useCallback((next: View, pushHistory = true) => {
    setView(next);
    if (pushHistory && typeof window !== "undefined") {
      window.history.pushState(next, "");
    }
    window.scrollTo({ top: 0 });
  }, []);

  // Listen for browser Back and Forward navigation
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.name) {
        setView(e.state as View);
      } else {
        setView({ name: "welcome" });
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
 
    // Token expire / invalid aana auto logout
  useEffect(() => {
    const onUnauthorized = () => {
      setAuthState(null);
      setView({ name: "login" });
    };
    window.addEventListener("mednevo:unauthorized", onUnauthorized);
    return () => window.removeEventListener("mednevo:unauthorized", onUnauthorized);
  }, []);

  // Page refresh / new tab: onboarding mudinjavangala direct dashboard-ku anuppu
  useEffect(() => {
    if (!getAuth() || window.history.state?.name) return;
    void (async () => {
      try {
        const r = await me();
        if (!r.onboardingCompleted) return;
        const p = await getProfile();
        open({ name: "dashboard", data: { ...p, name: r.user.name } as OnboardingData }, false);
      } catch {
        /* 401 is handled by the unauthorized listener */
      }
    })();
  }, [open]);

  const handleAuth = async (r: AuthResult) => {
    saveAuth(r.token, r.user);
    setAuthState(getAuth());
    setProgress(loadProgress());
    if (r.onboardingCompleted) {
      try {
        const p = await getProfile();
        open({ name: "dashboard", data: { ...p, name: r.user.name } as OnboardingData });
        return;
      } catch {
        /* fall through to welcome */
      }
    }
    open({ name: "welcome" });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* token already invalid */
    }
    clearAuth();
    setAuthState(null);
    setProgress(null);
    setSelectedDay(undefined);
    open({ name: "login" });
  };

  // Signup la kudutha name-ah Step 1 la prefill pannum (Name field max 40 chars)
  const freshData = (): OnboardingData => ({
    ...INITIAL_DATA,
    name: (getAuth()?.user.name ?? "").slice(0, 40),
  });

  const startSetup = () => {
    startNewDevPatient(); // dev: every new setup is a new patient
    clearProgress();
    setProgress(null);
    open({ name: "onboarding", step: 1, data: freshData() });
  };

  const resumeSetup = () => {
    if (!progress) return startSetup();
    open({ name: "onboarding", data: progress.data, step: progress.currentStep, completed: progress.completedSteps });
  };

  const startOver = () => {
    startNewDevPatient();
    clearProgress();
    setProgress(null);
    open({ name: "onboarding", step: 1, data: freshData() });
  };

  const handleStepChange = useCallback((step: StepId, currentData: OnboardingData) => {
    const nextView: View = { name: "onboarding", step, data: currentData };
    setView(nextView);
    if (typeof window !== "undefined") {
      window.history.pushState(nextView, "");
    }
  }, []);

    if (!auth) {
    if (view.name === "signup")
      return <SignupPage onAuth={handleAuth} onLogin={() => open({ name: "login" })} />;
    return <LoginPage onAuth={handleAuth} onSignup={() => open({ name: "signup" })} />;
  }

  if (view.name === "welcome" || view.name === "login" || view.name === "signup") {
    return <WelcomePage onGetStarted={startSetup} progress={progress} onResume={resumeSetup} onStartOver={startOver} />;
  }

   if (view.name === "dashboard") {
  return (
    <OnboardingLayout>
          <button
        onClick={handleLogout}
        className="fixed right-4 top-4 z-50 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow"
      >
        Log out
      </button>
      <Dashboard
        data={view.data}
        selectedDay={selectedDay}
        onEditSetup={() =>
          open({
            name: "onboarding",
            data: view.data,
            step: 11,
          })
        }
        onOpenTrends={() =>
          open({
            name: "trends",
            data: view.data,
          })
        }
        onOpenDailyLog={() =>
          open({
            name: "daily-log",
            data: view.data,
          })
        }
        onOpenSettings={() =>
          open({
            name: "settings",
            data: view.data,
          })
        }
        onOpenCalendar={() =>
          open({
            name: "calendar",
            data: view.data,
          })
        }
      />
    </OnboardingLayout>
  );
}

  if (view.name === "log" || view.name === "trends" || view.name === "daily-log" || view.name === "calendar" || view.name === "settings") {
    const back = () => open({ name: "dashboard", data: view.data });
    return (
      <OnboardingLayout>
        {view.name === "log" && <LogPeriodPage onDone={back} onBack={back} />}
        {view.name === "daily-log" && (
          <PhaseDailyLog
            data={view.data}
            initialDay={view.day ?? selectedDay}
            onDayChange={setSelectedDay}
            onBack={back}
            onOpenCalendar={() => open({ name: "calendar", data: view.data })}
            onOpenTrends={() => open({ name: "trends", data: view.data })}
            onOpenSettings={() => open({ name: "settings", data: view.data })}
          />
        )}
        {view.name === "calendar" && (
  <CalendarPage
    data={view.data}
    selectedDay={selectedDay}
    onBack={back}
    onOpenOverview={back}
    onOpenDailyLog={() =>
      open({
        name: "daily-log",
        data: view.data,
        day: selectedDay,
      })
    }
    onOpenTrends={() =>
      open({
        name: "trends",
        data: view.data,
      })
    }
    onOpenSettings={() =>
      open({
        name: "settings",
        data: view.data,
      })
    }
    onOpenDay={(day) => {
      setSelectedDay(day);
      open({
        name: "daily-log",
        data: view.data,
        day,
      });
    }}
  />
)}
        {view.name === "trends" && (
  <TrendsPage
    data={view.data}
    onBack={back}
    day={selectedDay}
    onOpenOverview={back}
    onOpenCalendar={() =>
      open({
        name: "calendar",
        data: view.data,
      })
    }
    onOpenDailyLog={() =>
      open({
        name: "daily-log",
        data: view.data,
        day: selectedDay,
      })
    }
    onOpenSettings={() =>
      open({
        name: "settings",
        data: view.data,
      })
    }
  />
)}
        {view.name === "settings" && (
          <PhaseSettings
            data={view.data}
            day={selectedDay}
            onBack={back}
            onOpenCalendar={() => open({ name: "calendar", data: view.data })}
            onOpenDailyLog={() => open({ name: "daily-log", data: view.data })}
            onOpenTrends={() => open({ name: "trends", data: view.data })}
          />
        )}
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      mode="fixed"
      headerRight={
        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-1.5 text-body-sm font-medium text-ink-muted md:flex">
            <Clock className="size-3.5 text-rose" aria-hidden="true" />
            About 3 minutes
          </p>
          <PrivacyPill />
        </div>
      }
    >
      <OnboardingFlow
        // Remount when resuming so the flow starts from the provided data and step.
        key={view.step ? `step-${view.step}` : "new"}
        initialData={view.data}
        initialStep={view.step ?? 1}
        initialCompleted={view.completed}
        onStepChange={handleStepChange}
        onComplete={async (data) => {
          // Persist data to Mednevo backend via enterprise API service layer
          await submitOnboardingProfile(data);
          setProgress(null);
          open({ name: "dashboard", data });
        }}
      />
    </OnboardingLayout>
  );
}