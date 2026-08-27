const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import { logger } from "./logger";

type TrackerCombatant = {
    id: string;
    name: string;
    img: string;
    disposition: number;
    acted: boolean;
    takenOut: boolean;
    isActive: boolean;
    turnsTotal: number;
    turnsTaken: number;
    canAct: boolean;
};



export class PassTheInitiativeApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static instance: PassTheInitiativeApp | null = null;

    static toggle(forceOpen = false) {
        if (!this.instance) this.instance = new PassTheInitiativeApp();
        if (this.instance.rendered) {
            if (forceOpen) {
                this.instance.bringToFront(); // Force the window to the front
            } else {
                this.instance.close();
            }
        } else {
            this.instance.render({ force: true });
        }
    }

    static refresh() {
        logger.trace("Refreshing tracker application.", { rendered: this.instance?.rendered ?? false });
        if (this.instance?.rendered) {
            this.instance.render(); // false triggers a re-render without forcing it to the front
        }
    }

    static DEFAULT_OPTIONS = {
        id: "pass-the-initiative-app",
        classes: ["pass-the-initiative"],
        title: "Pass the Initiative",
        position: { width: 700, height: 600 },
        window: {
            resizable: true
            // Removed the custom controls array so it behaves natively
        },
        actions: {
            startTurn: this.startTurn,
            increaseTurns: this.increaseTurns,
            decreaseTurns: this.decreaseTurns,
            removeActor: this.removeActor,
            toggleTakenOut: this.toggleTakenOut,
            nextRound: this.nextRound,
            skipRemaining: this.skipRemaining,
            undoSkip: this.undoSkip,
            clearAll: this.clearAll,
            endEncounter: this.endEncounter,
        }
    };

    static PARTS = {
        main: { template: "modules/pass-the-initiative/templates/tracker.hbs" }
    };

    async _onRender(_context: any, _options: any): Promise<void> {
        const element = (this as any).element as HTMLElement | undefined;
        element?.querySelectorAll<HTMLImageElement>(".pti-actor-img").forEach((image) => {
            const id = image.dataset.combatantId;
            if (!id) return;

            image.addEventListener("click", () => PassTheInitiativeApp.focusToken(id));
            image.addEventListener("dblclick", () => PassTheInitiativeApp.openActor(id));
        });
    }

    async _prepareContext(_options: any): Promise<any> {
        const combat = game.combat;
        logger.trace("Preparing tracker context.", { hasCombat: Boolean(combat) });
        if (!combat) {
            logger.debug("No active combat found while preparing context.");
            return { combatants: [] as TrackerCombatant[], hasCombat: false, isGM: game.user?.isGM };
        }

        const activeTurnId = combat.getFlag("pass-the-initiative", "activeTurnId");
        const skippedData = combat.getFlag("pass-the-initiative", "skipped") || [];
        const combatants: TrackerCombatant[] = combat.combatants.map((c: any) => {
            const flags = c.flags["pass-the-initiative"] || {};
            const turnsTotal = flags.turnsTotal ?? 1;
            const turnsTaken = flags.turnsTaken ?? 0;
            const takenOut = flags.takenOut ?? false;

            const acted = turnsTaken >= turnsTotal;
            const isActive = activeTurnId === c.id;

            return {
                id: c.id,
                name: c.name,
                img: c.img,
                disposition: c.token?.disposition ?? 0,
                acted,
                takenOut,
                isActive,
                turnsTotal,
                turnsTaken,
                canAct: !acted && !takenOut
            };
        });

        // Sort by name alphabetically
        combatants.sort((a: TrackerCombatant, b: TrackerCombatant) => a.name.localeCompare(b.name));
        let groupedCombatants = PassTheInitiativeApp.routeCombatants(combatants);
        logger.debug("Tracker context prepared.", {
            combatantCount: combatants.length,
            round: combat.round,
            activeTurnId
        });

        return {
            groupedCombatants,
            hasCombat: true,
            round: combat.round,
            isGM: game.user?.isGM,
            hasSkipped: Array.isArray(skippedData) && skippedData.length > 0
        };
    }

    static routeCombatants(combatants: TrackerCombatant[]): Record<"friendly" | "neutral" | "hostile", TrackerCombatant[]> {
        const routedCombatants: Record<"friendly" | "neutral" | "hostile", TrackerCombatant[]> = {
            friendly: [],
            hostile: [],
            neutral: []
        };

        for (const combatant of combatants) {
            const disposition = combatant.disposition === 1
                ? "friendly"
                : combatant.disposition === -1
                    ? "hostile"
                    : "neutral";
            routedCombatants[disposition].push(combatant);
        }

        return routedCombatants;
    }

    /* ------------------------------------ */
    /* Action Handlers                      */
    /* ------------------------------------ */

    static focusToken(id: string, tokenId?: string) {
        const combatant = game.combat?.combatants.get(id);
        const tokenDocument = combatant?.token as any;
        const resolvedTokenId = tokenId ?? combatant?.tokenId ?? tokenDocument?.id;
        const tokenObj = canvas?.tokens?.get(resolvedTokenId) ?? tokenDocument?.object;
        if (!tokenObj) {
            logger.warn("Cannot focus combatant because its token is not on the active canvas.", { id });
            return;
        }

        if (typeof tokenObj.control === "function") {
            tokenObj.control({ releaseOthers: true });
        }
        if (canvas?.ready && typeof canvas.animatePan === "function") {
            const center = tokenObj.center ?? { x: tokenObj.x, y: tokenObj.y };
            canvas.animatePan({ x: center.x, y: center.y, duration: 250 });
        }
    }

    static focusTokenForAll(id: string) {
        PassTheInitiativeApp.focusToken(id);
        if (game.user?.isGM && (game.settings as any).get("pass-the-initiative", "centerTokenForAll")) {
            const combatant = game.combat?.combatants.get(id) as any;
            const tokenId = combatant?.token?.id ?? combatant?.tokenId;
            game.socket?.emit("module.pass-the-initiative", { action: "focusToken", id, tokenId });
        }
    }

    static openActor(id: string) {
        const actor = game.combat?.combatants.get(id)?.actor as any;
        actor?.sheet?.render(true);
    }

    static async endEncounter() {
        const combat = game.combat;
        if (!combat) return;

        await (combat as any).endCombat();
        this.instance?.close();
    }

    static async startTurn(event: Event, target: HTMLElement) {
        const id = target.dataset.id;
        const combat = game.combat;
        logger.info("Starting combatant turn.", { id });
        if (!combat || !id) {
            logger.warn("Cannot start turn without active combat and combatant id.", { hasCombat: Boolean(combat), id });
            return;
        }

        const combatant = combat.combatants.get(id);
        if (!combatant) {
            logger.warn("Cannot start turn because combatant was not found.", { id });
            return;
        }

        const currentTaken = combatant.getFlag("pass-the-initiative", "turnsTaken") as number || 0;
        await combatant.setFlag("pass-the-initiative", "turnsTaken", currentTaken + 1);
        await combat.setFlag("pass-the-initiative", "activeTurnId", id);
        const turn = (combat as any).turns?.findIndex((entry: any) => entry.id === id) ?? -1;
        if (turn >= 0) await combat.update({ turn });
        logger.debug("Turn state updated.", { id, turnsTaken: currentTaken + 1 });

        PassTheInitiativeApp.focusTokenForAll(id);
    }

    static async increaseTurns(event: Event, target: HTMLElement) {
        const combatant = game.combat?.combatants.get(target.dataset.id!);
        logger.info("Increasing combatant turn total.", { id: target.dataset.id });
        if (!combatant) {
            logger.warn("Cannot increase turns because combatant was not found.", { id: target.dataset.id });
            return;
        }
        const total = combatant.getFlag("pass-the-initiative", "turnsTotal") as number ?? 1;
        await combatant.setFlag("pass-the-initiative", "turnsTotal", total + 1);
    }

    static async decreaseTurns(event: Event, target: HTMLElement) {
        const combatant = game.combat?.combatants.get(target.dataset.id!);
        logger.info("Decreasing combatant turn total.", { id: target.dataset.id });
        if (!combatant) {
            logger.warn("Cannot decrease turns because combatant was not found.", { id: target.dataset.id });
            return;
        }
        const total = combatant.getFlag("pass-the-initiative", "turnsTotal") as number ?? 1;
        if (total > 1) {
            await combatant.setFlag("pass-the-initiative", "turnsTotal", total - 1);
        } else {
            logger.debug("Turn total already at minimum.", { id: target.dataset.id, total });
        }
    }

    static async toggleTakenOut(event: Event, target: HTMLElement) {
        const combatant = game.combat?.combatants.get(target.dataset.id!);
        logger.info("Toggling combatant taken-out state.", { id: target.dataset.id });
        if (!combatant) {
            logger.warn("Cannot toggle state because combatant was not found.", { id: target.dataset.id });
            return;
        }
        const isOut = combatant.getFlag("pass-the-initiative", "takenOut") as boolean ?? false;
        await combatant.setFlag("pass-the-initiative", "takenOut", !isOut);
        PassTheInitiativeApp.focusTokenForAll(combatant.id);
    }

    static async removeActor(event: Event, target: HTMLElement) {
        const combatant = game.combat?.combatants.get(target.dataset.id!);
        logger.info("Removing combatant.", { id: target.dataset.id });
        if (!combatant) {
            logger.warn("Cannot remove combatant because it was not found.", { id: target.dataset.id });
            return;
        }
        await combatant.delete();
    }

    static async nextRound() {
        const combat = game.combat;
        logger.info("Advancing to the next round.");
        if (!combat) {
            logger.warn("Cannot advance round without active combat.");
            return;
        }

        // Reset turns taken for everyone
        const updates = combat.combatants.map((c: any) => ({
            _id: c.id,
            "flags.pass-the-initiative.turnsTaken": 0
        }));

        await combat.updateEmbeddedDocuments("Combatant", updates);
        await combat.update({
            round: combat.round + 1,
            "flags.pass-the-initiative.activeTurnId": null,
            "flags.pass-the-initiative.-=skipped": null // Remove skip data
        });
        logger.debug("Round advanced.", { round: combat.round + 1, resetCount: updates.length });
    }

    static async skipRemaining() {
        const combat = game.combat;
        logger.info("Skipping remaining combatant turns.");
        if (!combat) {
            logger.warn("Cannot skip turns without active combat.");
            return;
        }

        const skipped: Array<{ id: string, missed: number }> = [];
        const updates: any[] = [];

        for (const c of combat.combatants) {
            const flags = c.flags["pass-the-initiative"] || {};
            const taken = flags.turnsTaken ?? 0;
            const total = flags.turnsTotal ?? 1;
            const takenOut = flags.takenOut ?? false;

            if (!takenOut && taken < total) {
                skipped.push({ id: c.id, missed: total - taken });
                updates.push({ _id: c.id, "flags.pass-the-initiative.turnsTaken": total });
            }
        }

        if (updates.length > 0) {
            await combat.setFlag("pass-the-initiative", "skipped", skipped);
            await combat.updateEmbeddedDocuments("Combatant", updates);
            logger.debug("Remaining turns skipped.", { skippedCount: skipped.length });
        } else {
            logger.debug("No remaining turns to skip.");
        }
    }

    static async undoSkip() {
        const combat = game.combat;
        logger.info("Undoing skipped turns.");
        if (!combat) {
            logger.warn("Cannot undo skipped turns without active combat.");
            return;
        }

        const skipped = combat.getFlag("pass-the-initiative", "skipped") as Array<{ id: string, missed: number }>;
        if (!skipped || skipped.length === 0) {
            logger.debug("No skipped turns found to undo.");
            return;
        }

        const updates: any[] = [];
        for (const s of skipped) {
            const c = combat.combatants.get(s.id);
            if (c) {
                const current = c.flags["pass-the-initiative"]?.turnsTaken as number ?? 1;
                updates.push({ _id: c.id, "flags.pass-the-initiative.turnsTaken": Math.max(0, current - s.missed) });
            }
        }

        await combat.updateEmbeddedDocuments("Combatant", updates);
        await combat.unsetFlag("pass-the-initiative", "skipped");
        logger.debug("Skipped turns restored.", { skippedCount: skipped.length, restoredCount: updates.length });
    }

    static async clearAll() {
        const combat = game.combat;
        logger.info("Clearing all combatants.");
        if (!combat) {
            logger.warn("Cannot clear combatants without active combat.");
            return;
        }
        const ids = combat.combatants.map((c: any) => c.id);
        await combat.deleteEmbeddedDocuments("Combatant", ids);
        logger.debug("All combatants cleared.", { count: ids.length });
    }
}