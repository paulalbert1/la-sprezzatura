import { createContext, useContext, useReducer, useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "sanity";
import { Card, Tab, TabList, Flex, Stack, Text, Button, Spinner } from "@sanity/ui";
import { SparklesIcon, AddIcon, ImageIcon } from "@sanity/icons";
import { UsageBadge } from "./UsageBadge";
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
  const [usageLoading, setUsageLoading] = useState(true);

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
        {state.activeTab === "sessions" && state.activeView === "list" && (
          <Card padding={4}>
            <Flex align="center" justify="space-between">
              <Button
                icon={AddIcon}
                text="New Session"
                tone="primary"
                onClick={() => dispatch({ type: "OPEN_WIZARD" })}
              />
              {usage && <UsageBadge count={usage.count} limit={usage.limit} />}
              {usageLoading && <Spinner muted />}
            </Flex>
            <Card padding={5} tone="transparent" style={{ marginTop: 16 }}>
              <Stack space={3} style={{ alignItems: "center", textAlign: "center" }}>
                <SparklesIcon style={{ fontSize: 48, opacity: 0.3 }} />
                <Text size={2} align="center">No rendering sessions yet</Text>
                <Text size={1} muted align="center">
                  Create your first session to start generating design renderings.
                </Text>
                <Button
                  text="Create Session"
                  tone="primary"
                  onClick={() => dispatch({ type: "OPEN_WIZARD" })}
                />
              </Stack>
            </Card>
          </Card>
        )}

        {/* Sessions tab - wizard view (placeholder for Plan 02) */}
        {state.activeTab === "sessions" && state.activeView === "wizard" && (
          <Card padding={4}>
            <Text size={2}>Wizard placeholder -- implemented in Plan 02</Text>
            <Button
              text="Back"
              mode="ghost"
              onClick={() => dispatch({ type: "CLOSE_WIZARD" })}
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        {/* Sessions tab - session detail view (placeholder for Plan 03) */}
        {state.activeTab === "sessions" && state.activeView === "session-detail" && (
          <Card padding={4}>
            <Text size={2}>Chat view placeholder -- implemented in Plan 03</Text>
            <Button
              text="Back"
              mode="ghost"
              onClick={() => dispatch({ type: "BACK_TO_LIST" })}
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        {/* Design Options tab (placeholder for Plan 03) */}
        {state.activeTab === "design-options" && state.activeView === "list" && (
          <Card padding={4}>
            <Flex align="center" justify="space-between">
              <Text size={3} weight="semibold">Design Options</Text>
            </Flex>
            <Card padding={5} tone="transparent" style={{ marginTop: 16 }}>
              <Stack space={3} style={{ alignItems: "center", textAlign: "center" }}>
                <ImageIcon style={{ fontSize: 48, opacity: 0.3 }} />
                <Text size={2} align="center">No design options yet</Text>
                <Text size={1} muted align="center">
                  Promote renderings from your sessions to make them visible to clients.
                </Text>
              </Stack>
            </Card>
          </Card>
        )}
      </Card>
    </ToolContext.Provider>
  );
}
