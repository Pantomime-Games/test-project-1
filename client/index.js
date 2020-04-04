// @ts-check
import * as mediasoupClient from 'mediasoup-client'
import io from 'socket.io-client'

import { initGame } from './init-game'

main().catch(e => {
  console.error('An error occurred')
  console.error(e)
})

async function main() {
  // create the party if there is no party id in the query string
  const urlParams = new URLSearchParams(window.location.search)
  let partyId = urlParams.get('partyId')
  let party
  if (partyId) {
    party = await getParty(partyId)
  } else {
    party = await createParty()
    partyId = party.id
  }
  console.log('partyId', partyId)

  // join the party
  const partyConnection = await joinParty(partyId)
  console.log('partyConnection', partyConnection)

  // set up the device
  const device = await getDevice({
    routerRtpCapabilities: party.rtpCapabilities,
    partyConnection,
  })

  const socket = io()
  socket.on('update', update => {
    console.log('update', update)
    handleSubscriptionUpdate(update, device)
  })

  // initialize game
  // initGame()
}

async function getParty(partyId) {
  const party = await fetch(`/parties/${partyId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await party.json()
}

async function createParty() {
  const party = await fetch('/parties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await party.json()
}

async function joinParty(partyId) {
  const connection = await fetch(`/parties/${partyId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await connection.json()
}

async function getDevice({ routerRtpCapabilities, partyConnection }) {
  let device

  try {
    device = new mediasoupClient.Device()
    await device.load({ routerRtpCapabilities })

    if (!device.canProduce('video') && !device.canProduce('audio')) {
      throw new Error(`This device/browser cannot produce video or audio`)
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        // video: true,
        video: false,
      })
      const audioTrack = stream.getAudioTracks()[0]
      const sendTransport = device.createSendTransport(
        partyConnection.audioSendTransport
      )

      sendTransport.on('connect', (...args) => {
        console.log('connected on audio transport', ...args)
      })
      sendTransport.on('produce', (...args) => {
        console.log('produce event on transport', ...args)
      })

      await sendTransport.produce({
        track: audioTrack,
      })

      // const videoTrack = stream.getVideoTracks()[0];

      return device
    }
  } catch (error) {
    if (error.name === 'UnsupportedError') {
      console.warn('browser not supported')
    } else {
      console.error(error)
    }
  }
}

/**
 *
 * @param {*} update
 * @param {mediasoupClient.Device} device
 */
function handleSubscriptionUpdate(update, device) {
  console.log(update)
}
