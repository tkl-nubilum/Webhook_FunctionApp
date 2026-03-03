export function unescapeFieldNames(versions: object[]) {
  return versions.map((v) => {
    let result = {};

    for(const [key, value] of Object.entries(v)) {
        const cleanedKey = key.replace(/_x([0-9a-fA-F]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        result[cleanedKey] = value;
    }

    return result;
  })
}