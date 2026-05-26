import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
export default sql

export async function dbQuery(text: string, params: any[] = []) {
  const rows = await sql(text as any, params)
  return { rows: rows as any[] }
}
