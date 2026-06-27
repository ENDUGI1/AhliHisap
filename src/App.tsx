import { useProfile } from "@/hooks/useData";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { Dashboard } from "@/features/dashboard/Dashboard";

export default function App() {
  const profile = useProfile();

  // undefined = loading from IndexedDB
  if (profile === undefined) {
    return (
      <div className="dash__loading">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton" />
      </div>
    );
  }

  if (profile === null || !profile.onboarded) {
    return <Onboarding onDone={() => { /* live query swaps the view automatically */ }} />;
  }

  return <Dashboard profile={profile} />;
}
