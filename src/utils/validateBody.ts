import { WebhookBody, ReportBody } from "../types";

export function isWebhookBodyValid(body: unknown): body is WebhookBody {
    return (typeof body === "object" &&
        "value" in body &&
        typeof (body.value) === "object" &&
        Array.isArray(body.value) &&
        body.value.every(
            (v) => "subscriptionId" in v &&
                typeof (v.subscriptionId) === "string" &&
                "clientState" in v &&
                "expirationDateTime" in v &&
                typeof (v.expirationDateTime) === "string" &&
                "resource" in v &&
                typeof (v.resource) === "string" &&
                "tenantId" in v &&
                typeof (v.tenantId) === "string" &&
                "siteUrl" in v &&
                typeof (v.siteUrl) === "string" &&
                "webId" in v &&
                typeof (v.webId) === "string"));
}

export function isReportBodyValid(body: unknown): body is ReportBody {
    return (typeof body === "object" && "siteUrl" in body && typeof body.siteUrl === "string" && "listId" in body && typeof body.listId === "string");
}