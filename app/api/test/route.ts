import { pool } from '../../../lib/db'

export async function GET() {
    try {
        const result = await pool.query(
            'SELECT * FROM users'
        )

        return Response.json(result.rows)
    } catch (error) {
        console.error(error)

        return Response.json(
            { error: 'Database connection failed' },
            { status: 500 }
        )
    }
}