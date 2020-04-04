import { Server } from 'http'
import socketio, { Socket } from 'socket.io'
import { IPartyManager } from 'party'
import sharedsession from 'express-socket.io-session'
import { RequestHandler } from 'express'

type AuthSocket = Socket & {
  handshake: {
    session: RequestHandler & { id: string }
  }
}

export function initSocketServer(
  app: Server,
  session,
  partyMgr: IPartyManager
) {
  const io = socketio(app)
  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.handshake.session.id
    partyMgr.addUserSocket(userId, socket)

    socket.on('mymessage', msg => {
      console.log(typeof msg)
      console.log(msg)
    })

    socket.on('disconnect', () => {
      console.log('user disconnected')
      // leave rooms
      // partyMgr.removeUser(userId)
    })
  })

  // share session with express-session
  io.use(
    sharedsession(session, {
      autoSave: true,
    })
  )

  return io
}
