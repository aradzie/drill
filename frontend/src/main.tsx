import "./reset.css";
import "./index.css";
import "./fonts.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { App } from "./App.tsx";
import { DataReady } from "./collection/DataReady.tsx";
import { EventsProvider } from "./collection/EventsProvider.tsx";
import { ProblemsProvider } from "./collection/ProblemsProvider.tsx";
import { ErrorFallback } from "./ErrorFallback.tsx";
import { FilterProvider } from "./filter/FilterProvider.tsx";
import { HelpDialog } from "./help/HelpDialog.tsx";
import { TodayProvider } from "./time/TodayProvider.tsx";
import { HotkeyProvider } from "./ui/hotkeys/HotkeyProvider.tsx";
import { ToastContainer } from "./ui/toast/ToastContainer.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ProblemsProvider>
        <EventsProvider>
          <DataReady>
            <TodayProvider>
              <FilterProvider>
                <HotkeyProvider>
                  <App />
                  <HelpDialog />
                </HotkeyProvider>
              </FilterProvider>
            </TodayProvider>
          </DataReady>
        </EventsProvider>
      </ProblemsProvider>
    </ErrorBoundary>
    <ToastContainer />
  </StrictMode>,
);
