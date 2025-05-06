import { test, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

const TRANSACTIONS_ROUTES_PATH = '/transactions/'

test('user can create a new transaction', async () => {
  await request(app.server)
    .post(TRANSACTIONS_ROUTES_PATH)
    .send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit',
    })
    .expect(201)
})
