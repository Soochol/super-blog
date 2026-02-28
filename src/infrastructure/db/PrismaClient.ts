import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
    pgPool: pg.Pool;
};

function createPrismaClient(): { client: PrismaClient; pool: pg.Pool } {
    const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL']! });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({
        adapter,
        log: ['warn', 'error'],
    });
    return { client, pool };
}

if (!globalForPrisma.prisma) {
    const { client, pool } = createPrismaClient();
    globalForPrisma.prisma = client;
    globalForPrisma.pgPool = pool;
}

export const prisma = globalForPrisma.prisma;
export const pgPool = globalForPrisma.pgPool;
