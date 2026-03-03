import { InvocationContext } from "@azure/functions";
import { DiffEntry, VersionApiEntry } from "../types";

export function parseVersionHistory(allItemVersions: Array<Array<VersionApiEntry>>, siteUrl: URL, context: InvocationContext): DiffEntry[] {

    let changes: DiffEntry[] = [];

    for (const itemVersions of allItemVersions) {
        const id = itemVersions[0].ID;
        context.log(`Checking item with id=${id}`);
        const filePath = itemVersions[0].FileRef as string;
        const fileName = itemVersions[0].FileLeafRef;

        const entry: DiffEntry = {
            fileName: fileName,
            fileUrl: new URL(encodeURI(filePath), siteUrl).toString(),
            id: id,
            changes: []
        };

        for (const version of itemVersions) {
            context.log(`Version entry (time=${version.Last_x005f_x0020_x005f_Modified})`);
            const lastModified = new Date(version.Last_x005f_x0020_x005f_Modified).getTime();
            const createdAt = new Date(version.Created).getTime();

            const changeType = lastModified === createdAt ? "created" : "editted";

            context.log("Change type =", changeType);

            entry.changes.push({
                by: version.Editor.LookupValue,
                changeType,
                time: version.Last_x005f_x0020_x005f_Modified
            })
        }

        changes.push(entry);
    }

    return changes;
}