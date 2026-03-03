
export function getDifference(old: object, current: object): Record<string, { from: any, to: any }> {
    let result = {};

    for (const [key, value] of Object.entries(old)) {

        const currentValue = current[key];
        const oldValue = value;
        
        if (
            oldValue !== currentValue &&
            String(oldValue) !== String(currentValue) &&
            JSON.stringify(oldValue) !== JSON.stringify(currentValue)
        ) {
            result[key] = {
                from: oldValue,
                to: currentValue
            };
        }
    }

    return result;
}