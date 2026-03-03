export type WebhookBody = {
    value: {
        subscriptionId: string;
        clientState: unknown;
        expirationDateTime: string;
        resource: string;
        tenantId: string;
        siteUrl: string;
        webId: string;
    }[]
}

export type DiffEntry = {
    fileUrl: string;
    fileName: string;
    id: number;
    changes: {
        by: string;
        changeType: "editted" | "created" | "deleted";
        time: string;
    }[]
}

export type ReportBody = {
    siteUrl: string;
    listId: string;
}


export type ChangeApiEntry = {
    ChangeToken: {
        StringValue: string;
    };
    ChangeType: ChangeType;
    SiteId: string;
    Time: string;
    Editor: object;
    EditorEmailHint: null;
    ItemId: number;
    ListId: string;
    ServerRelativeUrl: string;
    SharedByUser: null,
    SharedWithUsers: null,
    UniqueId: string;
    WebId: string;
}

export type VersionApiEntry = {
    Title: string;
    ID: number;
    Modified: string;
    Editor: {
        LookupId: number;
        LookupValue: string;
        Email: string;
    };
    File: {
        Name: string;
        ServerRelativeUrl: string;
    };
    [k: string]: any;
}

export enum ChangeType {
    NoChange = 0,
    Add = 1,
    Update = 2,
    DeleteObject = 3,
}

export type ItemChange = {
    author: {
        Id: number;
        Name: string;
    }
    fieldName: string;
    from: any;
    to: any;
}