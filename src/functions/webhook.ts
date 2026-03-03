import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSp } from "../spClient";
import { isWebhookBodyValid } from "../utils/validateBody";
import { createChangeToken } from "@pnp/sp";
import { dateAdd } from "@pnp/common";
import { ChangeType } from "../types";
import { getDifference } from "../utils/getDifference";
import { unescapeFieldNames } from "../utils/cleanEscapes";
import { stripUnwantedFields } from "../utils/stripUnwantedFields";

export async function webhook(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body = JSON.parse(await request.text());

    const validationToken = request.query.get("validationtoken") as string | null;

    // Required for sharepoint to view as valid
    if (validationToken) {
        return { body: validationToken };
    }


    if (!isWebhookBodyValid(body) || body.value.length === 0) {
        return { status: 400, body: "Bad body format" }
    }

    let tenant: URL | undefined = new URL("https://nubilumictsro.sharepoint.com");

    context.debug("Got", body.value.length, "changes");

    for (const value of body.value) {
        const site = value.siteUrl;
        const listId = value.resource;

        try {
            const sp = getSp(tenant, site);

            const list = sp.web.lists.getById(listId);

            const fields = await list.fields.filter("Hidden eq false and ReadOnlyField eq false").select("InternalName")();
            const columns = fields.map(c => c.InternalName);

            const changes = await list.getChanges({
                Add: true,
                ChangeTokenEnd: undefined,
                ChangeTokenStart: createChangeToken("list", listId, dateAdd(new Date(), "minute", -10)),
                DeleteObject: true,
                Update: true,
                Item: true,
            });

            const lastChangedItem = changes[changes.length - 1];

            if (lastChangedItem.ChangeType === ChangeType.Update) {
                const versions = await list.items.getById(lastChangedItem.ItemId).versions.select(...columns, "Editor").top(2)();

                const unescapedVersions = unescapeFieldNames(versions);
                const stripped = stripUnwantedFields(unescapedVersions, columns);
                const diff = getDifference(stripped[1], stripped[0]);

                const changeAuthor = versions[0].Editor.LookupValue;
                context.log(`${changeAuthor} modified item with id ${lastChangedItem.ItemId}`);
                context.log(diff);

            } else if (lastChangedItem.ChangeType === ChangeType.Add) {
                const version = await list.items.getById(lastChangedItem.ItemId).versions.select(...columns, "Editor").top(1)();

                const unescapedVersions = unescapeFieldNames(version);
                const stripped = stripUnwantedFields(unescapedVersions, columns);

                const changeAuthor = version[0].Editor.LookupValue;
                context.log(`${changeAuthor} added item`);
                context.log(stripped);
            } else if (lastChangedItem.ChangeType === ChangeType.DeleteObject) {
                context.log("Item with id", lastChangedItem.ItemId, "got deleted");
            } else {
                context.log("Invalid changet type", lastChangedItem.ChangeType);
            }

        } catch (error) {
            context.error("Failed to fetch data", error);
        }
    }

    return { body: "OK" };
};

app.http('webhook', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: webhook
});
