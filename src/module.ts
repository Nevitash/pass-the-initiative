import { PassTheInitiativeApp } from "./app";
import { logger } from "./logger";
import { controlUtils } from "./utils/compability.utils";

import "./style.css"; // Instructs Vite to compile our CSS

const foundryHooks = Hooks as any;
const MODULE_ID = "pass-the-initiative";

// Register settings during init so Foundry can show them in Module Settings.
foundryHooks.once("init", () => {
  logger.info("Initialized.");
  Handlebars.registerHelper("canViewCombatant", (isHidden: boolean, isGM: boolean) => isGM || !isHidden);
  (game.settings as any).register(MODULE_ID, "enableLogging", {
    name: "Enable Logging",
    hint: "Enable Pass the Initiative messages in the browser console.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (enabled: boolean) => logger.setEnabled(enabled)
  });
  (game.settings as any).register(MODULE_ID, "minimumLogLevel", {
    name: "Minimum Log Level",
    hint: "Only show messages at this level or above.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      trace: "Trace",
      debug: "Debug",
      info: "Info",
      warn: "Warning",
      error: "Error"
    },
    default: "trace",
    onChange: (level: string) => logger.setLevel(level as any)
  });
  (game.settings as any).register(MODULE_ID, "centerTokenForAll", {
    name: "Center Token for All Players",
    hint: "Center the map for all players when a turn starts or a combatant is marked taken out.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  (game.settings as any).register(MODULE_ID, "openTrackerForAll", {
    name: "Open Tracker for All Players",
    hint: "Open the initiative tracker for all players when a turn starts or the round changes.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

// Read saved logging preferences after the world settings are available.
foundryHooks.once("ready", () => {
  logger.setEnabled((game.settings as any).get(MODULE_ID, "enableLogging"));
  logger.setLevel((game.settings as any).get(MODULE_ID, "minimumLogLevel") as any);
});

// Add a button to the Token Controls on the left side of the screen
foundryHooks.on("getSceneControlButtons", (controls: any) => {
  try {
    let tokenControls = controlUtils.getTokenControls(controls);

    if (tokenControls && tokenControls.tools) {
      const ptiTool = {
        name: "pass-the-initiative",
        title: "Pass the Initiative",
        icon: "fas fa-users",
        button: true,
        visible: true, // Force visibility early
        onChange: () => {
          PassTheInitiativeApp.toggle();
        }
      };

      controlUtils.addTokenButton(controls, ptiTool);

      console.log("Pass the Initiative | Successfully injected button!");
    } else {
      console.warn("Pass the Initiative | Could not find token controls.");
    }
  } catch (err) {
    console.error("Pass the Initiative | Failed to add scene control button:", err);
  }
});

// Combat updates synchronize refreshes, optional player focus, and tracker opening.
foundryHooks.on("updateCombat", (combat: any, changes: any) => {
  // Check if this update specifically changed the round or started a new turn
  const isRoundChange = changes.round !== undefined;
  const isTurnChange = changes.flags?.[MODULE_ID]?.activeTurnId !== undefined;
  const focusRequest = changes.flags?.[MODULE_ID]?.focusRequest;

  if (focusRequest && (game.user?.isGM || (game.settings as any).get(MODULE_ID, "centerTokenForAll"))) {
    PassTheInitiativeApp.focusToken(focusRequest.combatantId, focusRequest.tokenId);
  }

  const shouldOpenTracker = game.user?.isGM || (game.settings as any).get(MODULE_ID, "openTrackerForAll");
  if ((isRoundChange || isTurnChange) && shouldOpenTracker) {
    PassTheInitiativeApp.toggle(true); // Forces the window open and to the front for ALL players
  }
});

// Listeners to re-render the app instantly when the encounter changes
const refreshApp = (...args: unknown[]) => {
  logger.debug("Combat hook requested an application refresh.", { argumentCount: args.length });
  PassTheInitiativeApp.refresh();
};

foundryHooks.on("updateCombat", refreshApp);
foundryHooks.on("updateCombatant", refreshApp);
foundryHooks.on("updateToken", refreshApp);
foundryHooks.on("refreshToken", refreshApp);
foundryHooks.on("createActiveEffect", refreshApp);
foundryHooks.on("updateActiveEffect", refreshApp);
foundryHooks.on("deleteActiveEffect", refreshApp);
foundryHooks.on("createCombatant", refreshApp);
foundryHooks.on("deleteCombatant", refreshApp);
foundryHooks.on("deleteCombat", refreshApp);
