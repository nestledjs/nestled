import { Logger } from '@nestjs/common'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'

const REDIS_URL = process.env['REDIS_TLS_URL'] ?? process.env['REDIS_URL'] ?? ''
const secure = REDIS_URL ? /rediss:/.test(REDIS_URL) : false
Logger.verbose(`Redis URL: ${REDIS_URL}`)

if (!REDIS_URL) {
  Logger.warn('No Redis URL provided. PubSub functionality may be limited.')
}

const options = secure
  ? {
      tls: {
        rejectUnauthorized: false,
      },
    }
  : {}

const dateReviver = (_key: unknown, value: string | Date): Date => {
  const isISO8601Z = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/
  if (typeof value === 'string' && isISO8601Z.test(value)) {
    const tempDateNumber = Date.parse(value)
    if (!isNaN(tempDateNumber)) {
      return new Date(tempDateNumber)
    }
  }
  if (typeof value !== 'string') return value
  return new Date(value)
}

export const apiCorePubSub = new RedisPubSub({
  publisher: new Redis(REDIS_URL ?? 'redis://localhost:6379', options),
  subscriber: new Redis(REDIS_URL ?? 'redis://localhost:6379', options),
  reviver: dateReviver,
})
