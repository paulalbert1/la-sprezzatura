import { createContext, useContext, useReducer, useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "sanity";
import { Card, Tab, TabList, Spinner } from "@sanity/ui";
import { SessionList } from "./SessionList";
import { WizardContainer } from "./Wizard/WizardContainer";
import { ChatView } from "./ChatView";
import { DesignOptionsTab } from "./DesignOptionsTab";
import {
  INITIAL_WIZARD_DATA,
  getStudioHeaders,
} from "./types";
import type {
  ToolState,
  ToolAction,
  UsageData,
} from "./types";

// -- Reducer --
function toolReducer(state: ToolState, action: ToolAction): ToolState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab, activeView: "list", activeSessionId: null };
    case "OPEN_WIZARD":
      return { ...state, activeView: "wizard" };
    case "CLOSE_WIZARD":
      return { ...state, activeView: "list", wizardData: INITIAL_WIZARD_DATA };
    case "OPEN_SESSION":
      return { ...state, activeView: "session-detail", activeSessionId: action.sessionId };
    case "BACK_TO_LIST":
      return { ...state, activeView: "list", activeSessionId: null };
    case "UPDATE_WIZARD":
      return { ...state, wizardData: { ...state.wizardData, ...action.data } };
    case "RESET_WIZARD":
      return { ...state, wizardData: INITIAL_WIZARD_DATA };
    default:
      return state;
  }
}

const initialState: ToolState = {
  activeTab: "sessions",
  activeView: "list",
  activeSessionId: null,
  wizardData: INITIAL_WIZARD_DATA,
};

// -- Context --
interface ToolContextValue {
  state: ToolState;
  dispatch: React.Dispatch<ToolAction>;
  usage: UsageData | null;
  refreshUsage: () => void;
  sanityUserId: string;
}

export const ToolContext = createContext<ToolContextValue | null>(null);

export function useToolContext() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useToolContext must be used within RenderingTool");
  return ctx;
}

// -- Main Component --
export function RenderingTool() {
  const currentUser = useCurrentUser();
  const [state, dispatch] = useReducer(toolReducer, initialState);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(true); // used by child components via context future

  const sanityUserId = currentUser?.id || "";

  const refreshUsage = useCallback(async () => {
    if (!sanityUserId) return;
    try {
      const res = await fetch(
        `/api/rendering/usage?sanityUserId=${encodeURIComponent(sanityUserId)}`,
        { headers: getStudioHeaders() },
      );
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // Silently fail -- usage badge shows loading state
    } finally {
      setUsageLoading(false);
    }
  }, [sanityUserId]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  if (!currentUser) {
    return (
      <Card height="fill" display="flex" style={{ alignItems: "center", justifyContent: "center" }}>
        <Spinner muted />
      </Card>
    );
  }

  const showTabs = state.activeView === "list";

  return (
    <ToolContext.Provider value={{ state, dispatch, usage, refreshUsage, sanityUserId }}>
      <Card height="fill" overflow="auto" sizing="border">
        {showTabs && (
          <Card paddingX={4} paddingTop={4} paddingBottom={2}>
            <TabList space={1}>
              <Tab
                aria-controls="sessions-panel"
                id="sessions-tab"
                label="Sessions"
                selected={state.activeTab === "sessions"}
                onClick={() => dispatch({ type: "SET_TAB", tab: "sessions" })}
              />
              <Tab
                aria-controls="design-options-panel"
                id="design-options-tab"
                label="Design Options"
                selected={state.activeTab === "design-options"}
                onClick={() => dispatch({ type: "SET_TAB", tab: "design-options" })}
              />
            </TabList>
          </Card>
        )}

        {/* Sessions tab - list view */}
        {state.activeTab === "sessions" && state.activeView === "list" && <SessionList />}

        {/* Sessions tab - wizard view */}
        {state.activeTab === "sessions" && state.activeView === "wizard" && <WizardContainer />}

        {/* Sessions tab - session detail (chat view) */}
        {state.activeTab === "sessions" && state.activeView === "session-detail" && state.activeSessionId && (
          <ChatView sessionId={state.activeSessionId} />
        )}

        {/* Design Options tab */}
        {state.activeTab === "design-options" && state.activeView === "list" && (
          <DesignOptionsTab />
        )}
      </Card>
    </ToolContext.Provider>
  );
}
