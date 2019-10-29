import * as XMPP from 'stanza';
export declare enum MessageType {
    'chat' = "chat",
    'group-chat' = "group-chat",
    'error' = "error",
    'headline' = "headline",
    'normal' = "normal"
}
export declare enum StanzaType {
    message = "message",
    iq = "iq",
    presence = "presence"
}
export declare enum StanzaAttributes {
    to = "to",
    from = "from",
    type = "type"
}
export declare enum StanzaTitles {
    body = "body"
}
export interface XMPPConnectionOptions {
    service: string;
    domain: string;
    username: string;
    password: string;
}
export declare type Message = XMPP.Stanzas.Message;
export declare type Delay = XMPP.Stanzas.Delay;
export declare const onMessage$: () => import("rxjs").Observable<XMPP.Stanzas.ReceivedMessage>;
export declare const onIQ$: () => import("rxjs").Observable<any>;
export declare const onPresence$: () => import("rxjs").Observable<any>;
export declare const onConnectionChange$: () => import("rxjs").Observable<any>;
export declare function connect({ jid, password }: {
    jid?: string;
    password?: string;
}): void;
export declare function disconnect(): import("rxjs").Subscription;
export declare function send(message: Message): import("rxjs").Observable<{
    result: string;
}>;
