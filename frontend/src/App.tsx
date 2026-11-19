import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { LIST_NAMES } from "shared";
import { useCollection } from "./collection/useCollection.ts";
import { useEvents } from "./collection/useEvents.ts";
import { ProblemListPage } from "./dashboard/ProblemListPage.tsx";
import { useFilter } from "./filter/useFilter.ts";
import { Header } from "./Header.tsx";
import { ProblemPage } from "./problem/ProblemPage.tsx";
import { SettingsPage } from "./settings/SettingsPage.tsx";
import { StatsPage } from "./stats/StatsPage.tsx";
import { ScreenCenter } from "./ui/ScreenCenter.tsx";
import { linkClassName } from "./ui/styles.ts";

function WithHeader({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

function ProblemRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { listName } = useFilter();
  const { start, stop, review, isSubmitting } = useEvents();
  const collection = useCollection();
  const entry = collection.entries.find(({ problem }) => problem.id === id);

  if (entry == null) {
    return (
      <ScreenCenter>
        <p>Problem not found.</p>
        <Link to={`/problems/${listName}`} className={linkClassName(false)}>
          Back to problems
        </Link>
      </ScreenCenter>
    );
  }

  // "default" key means this is the first entry in the session (e.g. a bookmark), so there is no in-app page to go back to.
  function goBack() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(`/problems/${listName}`, { replace: true });
    }
  }

  return (
    <ProblemPage
      entry={entry}
      isSubmitting={isSubmitting}
      onStart={async () => {
        if (!isSubmitting) {
          await start(entry.problem.id);
        }
      }}
      onStop={async () => {
        if (!isSubmitting) {
          await stop(entry.problem.id);
        }
      }}
      onGrade={async (grade) => {
        if (!isSubmitting) {
          await review(entry.problem.id, grade);
          goBack();
        }
      }}
      onBack={goBack}
    />
  );
}

function ListRoute() {
  const { list } = useParams();
  if (!(LIST_NAMES as string[]).includes(list!)) {
    return <Navigate to="/problems/new" replace />;
  }
  return (
    <WithHeader>
      <ProblemListPage />
    </WithHeader>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/problems/new" replace />} />
      <Route path="/problems" element={<Navigate to="/problems/new" replace />} />
      <Route path="/problems/:list" element={<ListRoute />} />
      <Route path="/problem/:id" element={<ProblemRoute />} />
      <Route
        path="/stats"
        element={
          <WithHeader>
            <StatsPage />
          </WithHeader>
        }
      />
      <Route
        path="/settings"
        element={
          <WithHeader>
            <SettingsPage />
          </WithHeader>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
