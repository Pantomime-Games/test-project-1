import { Server } from 'http'
import socketio from 'socket.io'
import { IPartyManager } from 'party'

export function initSocketServer(app: Server, partyMgr: IPartyManager) {
  const io = socketio(app)
  io.on('connection', socket => {
    console.log('a user connected')

    socket.on('mymessage', msg => {
      console.log(typeof msg)
      console.log(msg)
    })

    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
}
