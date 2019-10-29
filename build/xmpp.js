"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const operators_1 = require("rxjs/operators");
const XMPP = __importStar(require("stanza"));
const rxjs_1 = require("rxjs");
//@ts-ignore
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('XMPP-CLIENT');
if (XMPP instanceof Function == undefined) {
    throw new Error('XMPP client constructor not callable, check XMPP client module installed.');
}
// Initialization
const client$ = new rxjs_1.ReplaySubject(1);
// Public types
var MessageType;
(function (MessageType) {
    MessageType["chat"] = "chat";
    MessageType["group-chat"] = "group-chat";
    MessageType["error"] = "error";
    MessageType["headline"] = "headline";
    MessageType["normal"] = "normal";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var StanzaType;
(function (StanzaType) {
    StanzaType["message"] = "message";
    StanzaType["iq"] = "iq";
    StanzaType["presence"] = "presence";
})(StanzaType = exports.StanzaType || (exports.StanzaType = {}));
var StanzaAttributes;
(function (StanzaAttributes) {
    StanzaAttributes["to"] = "to";
    StanzaAttributes["from"] = "from";
    StanzaAttributes["type"] = "type";
})(StanzaAttributes = exports.StanzaAttributes || (exports.StanzaAttributes = {}));
var StanzaTitles;
(function (StanzaTitles) {
    StanzaTitles["body"] = "body";
})(StanzaTitles = exports.StanzaTitles || (exports.StanzaTitles = {}));
// Private types
var XMPPConnectionStatus;
(function (XMPPConnectionStatus) {
    XMPPConnectionStatus["connecting"] = "connecting";
    XMPPConnectionStatus["connected"] = "connected";
    XMPPConnectionStatus["disconnected"] = "disconnected";
    XMPPConnectionStatus["error"] = "error";
})(XMPPConnectionStatus || (XMPPConnectionStatus = {}));
// Public observables
const _onMessage$ = new rxjs_1.Subject();
exports.onMessage$ = () => _onMessage$.asObservable();
const _onIQ$ = new rxjs_1.Subject();
exports.onIQ$ = () => _onIQ$.asObservable();
const _onPresence$ = new rxjs_1.Subject();
exports.onPresence$ = () => _onPresence$.asObservable();
let _status$;
exports.onConnectionChange$ = () => _status$.asObservable();
let connectionStatus = XMPPConnectionStatus.disconnected;
// Public functions
function connect({ jid = process.env.XMPP_USERNAME, password = process.env.XMPP_PASSWORD, server = process.env.XMPP_DOMAIN, transports = {
    websocket: process.env.XMPP_TRANSPORTS_WS || false,
    bosh: process.env.XMPP_TRANSPORTS_BOSH || false
} }) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    debug(`Initializing XMPP client instance...`);
    client$.next(XMPP.createClient({
        jid,
        server,
        password,
        transports
    }));
    setupListeners();
    connectToServer();
}
exports.connect = connect;
function disconnect() {
    if (connectionStatus === XMPPConnectionStatus.disconnected)
        throw new Error('XMPP client already disconnected');
    return client$.pipe(operators_1.take(1)).subscribe(client => client.disconnect());
}
exports.disconnect = disconnect;
function send(message) {
    if (connectionStatus === XMPPConnectionStatus.disconnected)
        throw new Error('Must be connected to XMPP server before sending stanza');
    debug(`Dispatching stanza to XMPP server...`);
    return client$.pipe(operators_1.take(1), operators_1.tap(client => client.sendMessage(message)), operators_1.map(() => ({ result: 'success' })));
}
exports.send = send;
// Private functions
function setupListeners() {
    client$.pipe(operators_1.take(1))
        .subscribe(client => {
        client.on('message', (stanza) => __awaiter(this, void 0, void 0, function* () {
            debug(`Received message stanza...`);
            _onMessage$.next(stanza);
        }));
        client.on('session:started', (address) => __awaiter(this, void 0, void 0, function* () {
            debug(`Connected to XMPP server as ${address}!`);
            setConnectionStatus(XMPPConnectionStatus.connected);
            debug(`Notifying XMPP server of initial presence`);
            client.sendPresence();
        }));
    });
}
function setConnectionStatus(status) {
    debug(`Setting connection status to: ${status}`);
    connectionStatus = status;
}
function connectToServer() {
    debug(`Connecting to XMPP server...`);
    setConnectionStatus(XMPPConnectionStatus.connecting);
    client$.pipe(operators_1.take(1)).subscribe(c => c.connect());
}
connect({
    jid: 'test',
    password: 'password',
    transports: {
        websocket: 'ws://localhost:5281/xmpp-websocket',
        bosh: false
    }
});
