import { randomBytes } from 'crypto'
import { createWorker } from 'mediasoup'
import {
  Worker,
  RtpCodecCapability,
  WebRtcTransport,
} from 'mediasoup/lib/types'
import {
  IPartyManager,
  IParty,
  IPartyConnection,
  ICreatePartyOptions,
  IJoinPartyOptions,
} from 'party'
import { PartyNotFoundError } from './errors'
import { Socket } from 'socket.io'
import { transportToJson } from './to-json'

type IUserSockets = { [userId: string]: Socket }
type IUserTransports = {
  [userId: string]: { video: WebRtcTransport; audio: WebRtcTransport }
}

let worker: Worker
let parties: { [id: string]: IParty } = {}
let userSockets: IUserSockets = {}
let userTransports: IUserTransports = {}

function newPartyId(): string {
  return randomBytes(16).toString('hex')
}

export async function initPartyManager(): Promise<IPartyManager> {
  // create the worker (C++ process)
  worker = await createWorker()

  // return manager interface
  return {
    createParty,
    joinParty,
    getPartyById,
    addUserSocket,
  }
}

async function createParty({ host }: ICreatePartyOptions): Promise<IParty> {
  // init the mediasoup router
  const router = await worker.createRouter({
    mediaCodecs: getMediaCodecs(),
  })

  // create a unique party id
  const id = newPartyId()

  // kick off updates to that party
  const cancelUpdates = startPartyUpdates(id)

  // add the party to the internal hash
  parties[id] = {
    hostId: host.id,
    id,
    router,
    members: [],
    destroy: () => {
      delete parties[id]
      cancelUpdates()
    },
  }

  return parties[id]
}

async function joinParty({
  partyId,
  userId,
}: IJoinPartyOptions): Promise<IPartyConnection> {
  console.log('partyId', partyId)
  const party = parties[partyId]

  if (!party) {
    throw new PartyNotFoundError()
  }

  // create transports for audio and video
  const transport = await party.router.createWebRtcTransport({
    listenIps: [
      {
        ip: '127.0.0.1',
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    appData: {
      userId,
      partyId,
    },
  })

  // register transport to user
  userTransports[userId] = {
    audio: transport,
    video: transport,
  }

  // add member to party
  party.members.push({ userId: userId })

  console.log(
    `New member joined party ${party.id}. Current members:`,
    party.members
  )

  return {
    partyId,
    audioSendTransport: transport,
    videoSendTransport: transport,
  }
}

// async to start with in case this becomes async later
async function getPartyById(partyId: string) {
  return parties[partyId]
}

async function addUserSocket(userId: string, socket: Socket) {
  userSockets[userId] = socket
}

function startPartyUpdates(partyId: string) {
  const intervalId = setInterval(() => {
    const party = parties[partyId]
    if (!party) {
      clearInterval(intervalId)
      return
    }

    // send messages to clients
    sendUpdates(party)
  }, 1000)

  // return the cancellation function
  return () => {
    clearInterval(intervalId)
  }
}

function sendUpdates(party: IParty) {
  party.members.forEach(member => {
    userSockets[member.userId].emit('update', {
      video: party.members
        .filter(m => {
          if (m.userId === member.userId) {
            return false
          }
          // in the future: algo for detecting who should be subscribed to

          return true
        })
        .map(m => {
          const { audio, video } = userTransports[m.userId]
          return {
            audio: transportToJson(audio),
            video: transportToJson(video),
          }
        }),
    })
  })
}

function getMediaCodecs(): RtpCodecCapability[] {
  return [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/H264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
      },
    },
  ]
}
