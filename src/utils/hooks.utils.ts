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

export const hookUtils = {
    getTokenControls(controls: any): any | undefined {
        const tokenControls = getControls("token", controls);
        if (tokenControls) return tokenControls;

        return getControls("tokens", controls);
    }
}