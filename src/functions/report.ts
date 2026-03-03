import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { getGraph, getSp } from "../spClient";
import { isReportBodyValid } from "../utils/validateBody";
import { dateAdd } from "@pnp/common";
import { createChangeToken } from "@pnp/sp";
import {
	ChangeApiEntry,
	ChangeType,
	DiffEntry,
	VersionApiEntry,
} from "../types";
import { parseVersionHistory } from "../utils/diffHistory";
import { DocumentLibraryBaseType } from "../constants";

export async function report(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	context.log(`Http function processed request for url "${request.url}"`);

	const body = JSON.parse(await request.text());
	if (!isReportBodyValid(body)) {
		return { status: 400, body: "Invalid body" };
	}

	const listId = body.listId;
	const siteUrl = body.siteUrl;

	const tenant: URL | undefined = new URL(
		"https://nubilumictsro.sharepoint.com",
	);
	const sp = getSp(tenant, siteUrl);

	context.debug(process.env);

	context.log("Got sp");

	const list = sp.web.lists.getById(listId);

	context.log("Got list");

	// Check if provided list is a document library
	const { BaseType } = await list.select("BaseType")();

	context.log("BaseType =", BaseType);
	if (BaseType != DocumentLibraryBaseType) {
		context.warn("Provided list is not a document library");
		return {
			status: 400,
			body: `List with id ${listId} is not a document library`,
		};
	}

	// // Fetch dynamically all list columns, to show in versions later
	// const fields = await list.fields
	// 	.filter("Hidden eq false and ReadOnlyField eq false")
	// 	.select("InternalName")();
	// const columns = fields.map((c) => c.InternalName);

	const changes = (await list.getChanges({
		Add: true,
		ChangeTokenEnd: undefined,
		ChangeTokenStart: createChangeToken(
			"list",
			listId,
			dateAdd(new Date(), "hour", -24),
		),
		DeleteObject: true,
		Update: true,
		Item: true,
	})) as ChangeApiEntry[];

	// Get unique item IDs from the list of changes
	// And find deleted items and store them away from the change history.
	// Deleted items cannot be accessed via versions
	let deletedItems: DiffEntry[] = [];

	const seenIds = new Set();
	let deduplicatedItems: ChangeApiEntry[] = [];

	// Sort so that deleted items are seen first (deleted ChangeType has highest value)
	const sortedChanges = changes.sort((a, b) => (b.ChangeType - a.ChangeType));

	for (const change of sortedChanges) {
		if (seenIds.has(change.ItemId))
			continue;

		seenIds.add(change.ItemId);

		if (change.ChangeType === ChangeType.DeleteObject) {
			deletedItems.push({
				id: change.ItemId,
				fileName: null,
				fileUrl: null,
				changes: [{
					by: null,
					changeType: "deleted",
					time: change.Time
				}]
			})

		} else {
			deduplicatedItems.push(change);
		}
	}

	const [batch, execute] = sp.batched();
	const batchList = batch.web.lists.getById(listId);

	const twentyFourHoursAgo = dateAdd(new Date(), "hour", -24);

	context.log("Batching requests");

	let promises = [];
	for (const change of deduplicatedItems) {
		const promise = batchList.items
			.getById(change.ItemId)
			.versions.filter(
				`Modified ge datetime'${twentyFourHoursAgo.toISOString()}'`,
			)
			// .select("*")();
			.select("FileRef", "FileLeafRef", "Editor", "Created", "ID", "Last_x005f_x0020_x005f_Modified")();

		promises.push(promise);
	}

	await execute();
	const items = await Promise.all(promises);

	context.log(deduplicatedItems);
	context.log(items);

	context.log("Comparing histories");

	const parsedVersions = parseVersionHistory(items, tenant, context);

	return { jsonBody: [...parsedVersions, ...deletedItems] };
}

app.http("report", {
	methods: ["POST"],
	authLevel: "anonymous",
	handler: report,
});
