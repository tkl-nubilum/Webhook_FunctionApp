import { AzureCliCredential, ChainedTokenCredential, DefaultAzureCredential } from "@azure/identity";
import { AzureIdentity } from "@pnp/azidjsclient";
import { GraphDefault, SPDefault } from "@pnp/nodejs";
import { SPFI, spfi } from "@pnp/sp";
import { GraphFI, graphfi } from "@pnp/graph";

import "@pnp/sp/presets/all";
import "@pnp/graph/presets/all";

let sp: SPFI | undefined = undefined;
let graph: GraphFI | undefined = undefined;

const credentials = new ChainedTokenCredential(new AzureCliCredential(), new DefaultAzureCredential())

export function getSp(tenant: URL, site: string): SPFI {
    if (sp === undefined) {
        sp = spfi(new URL(site, tenant).toString()).using(
            SPDefault(),
            AzureIdentity(credentials, [new URL("/.default", tenant).toString()], null)
        );
    }

    return sp;
}

export function getGraph(): GraphFI {
    if (graph === undefined) {
        graph = graphfi().using(
            GraphDefault(),
            AzureIdentity(credentials, ["https://graph.microsoft.com/.default"], null)
        );
    }

    return graph;
}