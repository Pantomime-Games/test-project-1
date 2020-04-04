import { Router, WebRtcTransport } from 'mediasoup/lib/types'
import { Socket } from 'socket.io'

export interface IPartyConnection {
  partyId: string
  audioSendTransport: WebRtcTransport
  videoSendTransport: WebRtcTransport
}

export interface IParty {
  id: string
  hostId: string
  router: Router
  members: {
    userId: string
  }[]
  destroy: () => void
}

export interface ICreatePartyOptions {
  host: { id: string }
}

export interface IJoinPartyOptions {
  partyId: string
  userId: string
}

export interface IPartyManager {
  createParty: (createOptions: ICreatePartyOptions) => Promise<IParty>
  joinParty: (joinOptions: IJoinPartyOptions) => Promise<IPartyConnection>
  getPartyById: (partyId: string) => Promise<IParty>
  addUserSocket: (userId: string, socket: Socket) => Promise<void>
}
