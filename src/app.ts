import { resolve } from 'path'
import { createServer } from 'http'
import Express from 'express'
import Session from 'express-session'
import bodyParser from 'body-parser'
import asyncHandler from 'express-async-handler'
import { initPartyManager } from './party-manager'
import { initSocketServer } from './socket-server'
import { PartyNotFoundError } from './errors'
import { partyToJson, partyConnectionToJson } from './to-json'

export async function initApp() {
  const partyMgr = await initPartyManager()

  const app = Express()
  const session = Session({
    secret: 'pantomime cunnilingus',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
  app.disable('X-Powered-By')
  app.use(bodyParser())

  app.use(session)

  // Get party
  app.get(
    '/parties/:partyId',
    asyncHandler(async (req, res) => {
      const { partyId } = req.params
      const party = await partyMgr.getPartyById(partyId)
      if (!party) {
        throw new PartyNotFoundError()
      }
      res.json(partyToJson(party))
    })
  )

  // Creates a party
  app.post(
    '/parties',
    asyncHandler(async (req, res) => {
      // authorization here...
      const party = await partyMgr.createParty({
        host: {
          id: req.session.id,
        },
      })
      res.json(partyToJson(party))
    })
  )

  // Join a party
  app.post(
    '/parties/:partyId/join',
    asyncHandler(async (req, res) => {
      const { partyId } = req.params
      const partyConnection = await partyMgr.joinParty({
        partyId,
        userId: req.session.id,
      })
      res.json(partyConnectionToJson(partyConnection))
    })
  )

  app.use(Express.static(resolve(__dirname, '../client/')))

  app.use((err, req, res, next) => {
    if (err instanceof PartyNotFoundError) {
      return res.status(404).json({ message: 'party not found' })
    }
    next(err)
  })

  // initialize socket server
  const server = createServer(app)
  const io = initSocketServer(server, session, partyMgr)

  return server
}
