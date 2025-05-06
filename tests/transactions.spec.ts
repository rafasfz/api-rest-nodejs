import { it, expect, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  const TRANSACTIONS_ROUTES_PATH = '/transactions'

  interface TransactionBody {
    title: string
    amount: number
    type: 'credit' | 'debit'
  }

  const creditTransactionBody: TransactionBody = {
    title: 'Credit transaction',
    amount: 5000,
    type: 'credit',
  }

  const debitTransactionBody: TransactionBody = {
    title: 'Debit transaction',
    amount: 2000,
    type: 'debit',
  }

  async function createTransactionRequest(
    transactionBody: TransactionBody = creditTransactionBody,
    cookies?: string[],
  ) {
    const requestCreateTransaction = request(app.server).post(
      TRANSACTIONS_ROUTES_PATH,
    )

    if (cookies) {
      requestCreateTransaction.set('Cookie', cookies)
    }

    return await requestCreateTransaction.send(transactionBody)
  }

  async function getFirstTrasactionId(cookies: string[]) {
    const listTransactionsResponse = await request(app.server)
      .get(TRANSACTIONS_ROUTES_PATH)
      .set('Cookie', cookies)
      .expect(200)

    return listTransactionsResponse.body.transactions[0].id
  }

  it('shouble be able to user can create a new transaction', async () => {
    await request(app.server)
      .post(TRANSACTIONS_ROUTES_PATH)
      .send(creditTransactionBody)
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await createTransactionRequest()

    const cookies = createTransactionResponse.get('Set-Cookie') as string[]

    const listTransactionsResponse = await request(app.server)
      .get(TRANSACTIONS_ROUTES_PATH)
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        title: creditTransactionBody.title,
        amount:
          creditTransactionBody.type === 'credit'
            ? creditTransactionBody.amount
            : -creditTransactionBody.amount,
        created_at: expect.any(String),
      }),
    ])
  })

  it('should be able to get a specific transactions', async () => {
    const createTransactionResponse = await createTransactionRequest(
      creditTransactionBody,
    )

    const cookies = createTransactionResponse.get('Set-Cookie') as string[]

    const transactionId = await getFirstTrasactionId(cookies)

    const getTransactionResponse = await request(app.server)
      .get(`${TRANSACTIONS_ROUTES_PATH}/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: creditTransactionBody.title,
        amount:
          creditTransactionBody.type === 'credit'
            ? creditTransactionBody.amount
            : -creditTransactionBody.amount,
        created_at: expect.any(String),
      }),
    )
  })

  it('should be able to get the summary of transactions', async () => {
    const createCreditTransactionResponse = await createTransactionRequest(
      creditTransactionBody,
    )

    const cookies = createCreditTransactionResponse.get(
      'Set-Cookie',
    ) as string[]

    await createTransactionRequest(debitTransactionBody, cookies)

    const summaryTransactionsResponse = await request(app.server)
      .get(`${TRANSACTIONS_ROUTES_PATH}/summary`)
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryTransactionsResponse.body.summary).toEqual({
      amount: creditTransactionBody.amount - debitTransactionBody.amount,
    })
  })
})
