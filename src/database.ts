import 'dotenv/config'
import { knex as setupKnex, Knex } from 'knex'

const DATABASE_URL = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : './db/app.db'

export const config: Knex.Config = {
  client: 'sqlite',
  connection: {
    filename: DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = setupKnex(config)
