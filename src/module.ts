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
  Handlebars.registerHelper("dispositionLabel", (disposition: string) =>
    game.i18n?.localize(`PTI.DISPOSITION.${disposition.toUpperCase()}`) ?? disposition
  );
  (game.settings as any).register(MODULE_ID, "enableLogging", {
    name: "PTI.SETTINGS.ENABLE_LOGGING.NAME",
    hint: "PTI.SETTINGS.ENABLE_LOGGING.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (enabled: boolean) => logger.setEnabled(enabled)
  });
  (game.settings as any).register(MODULE_ID, "minimumLogLevel", {
    name: "PTI.SETTINGS.MINIMUM_LOG_LEVEL.NAME",
    hint: "PTI.SETTINGS.MINIMUM_LOG_LEVEL.HINT",
    scope: "world",
    config: true,
    type: String,
    choices: {
      trace: "PTI.LOG_LEVEL.TRACE",
      debug: "PTI.LOG_LEVEL.DEBUG",
      info: "PTI.LOG_LEVEL.INFO",
      warn: "PTI.LOG_LEVEL.WARN",
      error: "PTI.LOG_LEVEL.ERROR"
    },
    default: "trace",
    onChange: (level: string) => logger.setLevel(level as any)
  });
  (game.settings as any).register(MODULE_ID, "centerTokenForAll", {
    name: "PTI.SETTINGS.CENTER_TOKEN.NAME",
    hint: "PTI.SETTINGS.CENTER_TOKEN.HINT",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  (game.settings as any).register(MODULE_ID, "openTrackerForAll", {
    name: "PTI.SETTINGS.OPEN_TRACKER.NAME",
    hint: "PTI.SETTINGS.OPEN_TRACKER.HINT",
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
        title: "PTI.TITLE",
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
