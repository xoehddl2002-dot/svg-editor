import { setupWorker } from 'msw/browser'
import { serviceHandlers } from './serviceHandlers'
import { staticHandlers } from './staticsHandlers'

export const worker = setupWorker(...staticHandlers, ...serviceHandlers)
