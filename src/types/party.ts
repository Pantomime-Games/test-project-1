import { Router, WebRtcTransport } from 'mediasoup/lib/types'

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
}
