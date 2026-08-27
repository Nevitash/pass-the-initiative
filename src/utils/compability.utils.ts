import { logger } from "../logger";

function getControls(key: string, controls: any): any | undefined {
    if (Array.isArray(controls)) {
        const matchedControls = controls.find((c: any) => c.name === key || c.id === key);
        if (matchedControls) return matchedControls;
    }

    if (controls?.has && controls?.get) {
        const matchedControls = controls.get(key);
        if (matchedControls) return matchedControls;
    }

    if (controls) {
        const matchedControls = controls[key];
        if (matchedControls) return matchedControls;

        const objectControls = Object.values(controls).find((c: any) => c && (c.name === key || c.id === key));
        if (objectControls) return objectControls;
    }

    return undefined;
}

function addButton(controls: { tools: any }, button: { name: string }): boolean {
    if (!controls || !button) {
        logger.warn("hookUtils.addButton called with invalid controls or button:", { controls, button });
        return false;
    }

    if (Array.isArray(controls.tools)) {
        controls.tools.push(button); // V11/V12 Fallback
    } else {
        controls.tools[button.name] = button; // V13 Approach
    }
    return true;
}

export const controlUtils = {
    getTokenControls(controls: any): any | undefined {
        const tokenControls = getControls("token", controls);
        if (tokenControls) return tokenControls;

        return getControls("tokens", controls);
    },
    addButton(controls: { tools: any }, button: { name: string }): boolean {
        return addButton(controls, button);
    },
    addTokenButton(controls: any, button: { name: string }): boolean {
        let tokenControls = this.getTokenControls(controls);
        if (!tokenControls) return false;
        return addButton(tokenControls, button);
    }
}