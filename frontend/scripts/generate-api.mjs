/**
 * Generates `src/lib/api/schema.d.ts` from OpenAPI.
 * @see https://openapi-ts.dev/cli
 *
 * Usage:
 *   npm run generate:api
 *     → uses ./openapi-stub.yaml (default)
 *
 *   OPENAPI_URL=https://localhost:8000/openapi.json npm run generate:api
 *     → fetches live FastAPI spec (dev server must allow CORS or use file download)
 */
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const defaultSpec = path.join(root, 'openapi-stub.yaml')
const input = process.env.OPENAPI_URL ?? process.env.VITE_OPENAPI_URL ?? defaultSpec
const out = path.join(root, 'src/lib/api/schema.d.ts')

execSync(`npx openapi-typescript "${input}" -o "${out}"`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env },
})
