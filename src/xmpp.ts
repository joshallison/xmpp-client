import { take, tap, map } from 'rxjs/operators'
import * as XMPP from 'stanza'
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs'
//@ts-ignore
import Debug from 'debug'

const debug = Debug('XMPP-CLIENT')

if (XMPP instanceof Function == undefined) {
  throw new Error('XMPP client constructor not callable, check XMPP client module installed.')
}

// Initialization
const client$ = new ReplaySubject<XMPP.Agent>(1)

// Public types
export enum MessageType {
  'chat' = 'chat',
  'group-chat' = 'group-chat',
  'error' = 'error',
  'headline' = 'headline',
  'normal' = 'normal'
}

export enum StanzaType {
  message = 'message',
  iq = 'iq',
  presence = 'presence'
}

export enum StanzaAttributes {
  to = 'to',
  from = 'from',
  type = 'type'
}

export enum StanzaTitles {
  body = 'body'
}

export interface XMPPConnectionOptions {
  service: string
  domain: string
  username: string
  password: string
}

export type Message = XMPP.Stanzas.Message
export type Delay = XMPP.Stanzas.Delay

// Private types
enum XMPPConnectionStatus {
  'connecting' = 'connecting',
  'connected' = 'connected',
  'disconnected' = 'disconnected',
  'error' = 'error'
}

export interface ConnectOptions {
  jid?: string
  password?: string
  server?: string
  transports: {
    websocket: string | false
    bosh: string | false
  }
}

// Public observables
const _onMessage$ = new Subject<XMPP.Stanzas.ReceivedMessage>()
export const onMessage$ = () => _onMessage$.asObservable()

const _onIQ$ = new Subject<any>()
export const onIQ$ = () => _onIQ$.asObservable()

const _onPresence$ = new Subject<any>()
export const onPresence$ = () => _onPresence$.asObservable()

let _status$: BehaviorSubject<any>
export const onConnectionChange$ = () => _status$.asObservable()

let connectionStatus: XMPPConnectionStatus = XMPPConnectionStatus.disconnected

// Public functions
export function connect({
  jid = process.env.XMPP_USERNAME,
  password = process.env.XMPP_PASSWORD,
  server = process.env.XMPP_DOMAIN,
  transports = {
    websocket: process.env.XMPP_TRANSPORTS_WS || false,
    bosh: process.env.XMPP_TRANSPORTS_BOSH || false
  }
}: ConnectOptions): void {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  debug(`Initializing XMPP client instance...`)
  client$.next(XMPP.createClient({
    jid,
    server,
    password,
    transports
  }))
  setupListeners()
  connectToServer()
}

export function disconnect() {
  if (connectionStatus === XMPPConnectionStatus.disconnected) throw new Error('XMPP client already disconnected')
  return client$.pipe(take(1)).subscribe(client => client.disconnect())
}

export function send(message: Message) 
{
  if (connectionStatus === XMPPConnectionStatus.disconnected) throw new Error('Must be connected to XMPP server before sending stanza')
  debug(`Dispatching stanza to XMPP server...`)
  return client$.pipe(take(1), tap(client => client.sendMessage(message)), map(() => ({ result: 'success' })))
}

// Private functions
function setupListeners() {
  client$.pipe(take(1))
    .subscribe(client => {
      client.on('message', async stanza => {
          debug(`Received message stanza...`)
          _onMessage$.next(stanza)
      })
      client.on('session:started', async address => {
        debug(`Connected to XMPP server as ${address}!`)
        setConnectionStatus(XMPPConnectionStatus.connected)
        debug(`Notifying XMPP server of initial presence`)
        client.sendPresence();
      })
    })
}

function setConnectionStatus(status: XMPPConnectionStatus) {
  debug(`Setting connection status to: ${status}`)
  connectionStatus = status
}

function connectToServer() {
  debug(`Connecting to XMPP server...`)
  setConnectionStatus(XMPPConnectionStatus.connecting)
  client$.pipe(take(1)).subscribe(c => c.connect())
}

connect({ 
  jid: 'test',
  password: 'password',
  transports: {
    websocket: 'ws://localhost:5281/xmpp-websocket',
    bosh: false
  }
})