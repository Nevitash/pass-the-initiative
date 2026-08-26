import { PassTheInitiativeApp } from "./app";
import { logger } from "./logger";
import "./style.css"; // Instructs Vite to compile our CSS

const foundryHooks = Hooks as any;

foundryHooks.once("init", () => {
  logger.info("Initialized.");
});

// Add a button to the Token Controls on the left side of the screen
foundryHooks.on("getSceneControlButtons", (controls: any) => {
  try {
    let tokenControls;
    
    // Safely handle different Foundry versions
    // V13 renamed this from "token" to "tokens"
    if (Array.isArray(controls)) {
      tokenControls = controls.find((c: any) => c.name === "token" || c.name === "tokens" || c.id === "tokens");
    } else if (controls?.has && controls?.get) {
      tokenControls = controls.get("tokens") || controls.get("token"); 
    } else if (controls) {
      // V13 direct dictionary access
      tokenControls = controls["tokens"] || controls["token"] || Object.values(controls).find((c: any) => c && (c.name === "tokens" || c.name === "token"));
    }

    if (tokenControls && tokenControls.tools) {
      const ptiTool = {
        name: "pass-the-initiative",
        title: "Pass the Initiative",
        icon: "fas fa-users",
        button: true,
        visible: true, // Force visibility early
        onClick: () => {
          if (game?.user?.isGM) {
            PassTheInitiativeApp.toggle();
          } else {
            ui.notifications?.warn("Only the GM can use Pass the Initiative.");
          }
        }
      };

      // V13 changed `tools` from an Array to an Object
      if (Array.isArray(tokenControls.tools)) {
        tokenControls.tools.push(ptiTool); // V11/V12 Fallback
      } else {
        tokenControls.tools["pass-the-initiative"] = ptiTool; // V13 Approach
      }

      console.log("Pass the Initiative | Successfully injected button!");
    } else {
      console.warn("Pass the Initiative | Could not find token controls.");
    }
  } catch (err) {
    console.error("Pass the Initiative | Failed to add scene control button:", err);
  }
});

// Listen for manual GM broadcasts to show the app
foundryHooks.once("ready", () => {
  game.socket?.on("module.pass-the-initiative", (data: any) => {
    if (data.action === "showApp") {
      PassTheInitiativeApp.toggle(true);
    }
  });
});

// Automatically refresh the UI, and auto-focus if a new turn/round starts
foundryHooks.on("updateCombat", (combat: any, changes: any) => {
  PassTheInitiativeApp.refresh();

  // Check if this update specifically changed the round or started a new turn
  const isRoundChange = changes.round !== undefined;
  const isTurnChange = changes.flags?.["pass-the-initiative"]?.activeTurnId !== undefined;

  if (isRoundChange || isTurnChange) {
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
foundryHooks.on("createCombatant", refreshApp);
foundryHooks.on("deleteCombatant", refreshApp);
foundryHooks.on("deleteCombat", refreshApp);

// Standard refresh listeners
foundryHooks.on("updateCombatant", () => PassTheInitiativeApp.refresh());
foundryHooks.on("createCombatant", () => PassTheInitiativeApp.refresh());
foundryHooks.on("deleteCombatant", () => PassTheInitiativeApp.refresh());
foundryHooks.on("deleteCombat", () => PassTheInitiativeApp.refresh());