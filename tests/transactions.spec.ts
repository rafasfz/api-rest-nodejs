import { it, expect, beforeAll, afterAll, describe } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  const TRANSACTIONS_ROUTES_PATH = '/transactions/'

  const transactionBody = {
    title: 'New transaction',
    amount: 5000,
    type: 'credit',
  }

  it('shouble be able to user can create a new transaction', async () => {
    await request(app.server)
      .post(TRANSACTIONS_ROUTES_PATH)
      .send(transactionBody)
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post(TRANSACTIONS_ROUTES_PATH)
      .send(transactionBody)

    const cookies = createTransactionResponse.get('Set-Cookie') as string[]

    const listTransactionsResponse = await request(app.server)
      .get(TRANSACTIONS_ROUTES_PATH)
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        title: transactionBody.title,
        amount:
          transactionBody.type === 'credit'
            ? transactionBody.amount
            : -transactionBody.amount,
        created_at: expect.any(String),
      }),
    ])
  })
})
