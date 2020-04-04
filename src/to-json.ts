import { IParty, IPartyConnection } from 'party'
import { WebRtcTransport } from 'mediasoup/lib/types'

export function partyToJson(party: IParty) {
  return {
    id: party.id,
    rtpCapabilities: party.router.rtpCapabilities,
  }
}

export function partyConnectionToJson(connection: IPartyConnection) {
  const { audioSendTransport, videoSendTransport } = connection
  return {
    audioSendTransport: transportToJson(audioSendTransport),
    videoSendTransport: transportToJson(videoSendTransport),
  }
}

export function transportToJson(transport: WebRtcTransport) {
  const {
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    sctpParameters,
  } = transport
  return { id, iceParameters, iceCandidates, dtlsParameters, sctpParameters }
}
