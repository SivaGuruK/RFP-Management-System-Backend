import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  MONGO_URI: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
