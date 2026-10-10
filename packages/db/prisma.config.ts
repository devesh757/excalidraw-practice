import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';          // ← changed
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';  // ← keep as is

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});