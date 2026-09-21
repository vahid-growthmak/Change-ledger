import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Narrows the attachments bucket's CORS rule to the origins that actually
 * upload. Optional hardening, not setup.
 *
 * Attachments are posted by the client's browser straight to Neon Object
 * Storage, so the bucket's CORS rule is what permits the upload. Neon
 * provisions buckets with `AllowedOrigins: ["*"]`, which already works —
 * this exists only for tightening it. `neon.ts` can't declare CORS (its
 * bucket definition covers access level and nothing else), so it lives here.
 *
 *   npm run storage:cors -w @growthmak/ledger -- https://ledger.growthmak.com
 *
 * Origins may also come from ATTACHMENT_CORS_ORIGINS as a comma-separated
 * list. localhost is always included so `npm run dev:ledger` works.
 *
 * PutBucketCors REPLACES the rule rather than merging into it, so every
 * origin that uploads has to appear in one invocation. Miss one and uploads
 * from it start failing in the browser.
 */

const BUCKET = 'attachments';
const DEV_ORIGINS = ['http://localhost:3457', 'http://127.0.0.1:3457'];

async function main() {
  const { AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_REGION, NEON_STORAGE_REGION } = process.env;
  if (!AWS_ENDPOINT_URL_S3 || !AWS_ACCESS_KEY_ID) {
    throw new Error(
      'Missing AWS_ENDPOINT_URL_S3 / AWS_ACCESS_KEY_ID. Run `neon env pull`, or copy the AWS_* variables into apps/ledger/.env.local.',
    );
  }

  const fromArgs = process.argv.slice(2);
  const fromEnv = (process.env.ATTACHMENT_CORS_ORIGINS ?? '').split(',');
  const origins = [...new Set([...DEV_ORIGINS, ...fromArgs, ...fromEnv].map((o) => o.trim()).filter(Boolean))];

  const client = new S3Client({
    endpoint: AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    region: AWS_REGION ?? NEON_STORAGE_REGION ?? 'us-east-1',
  });

  await client.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            // POST is the signed-form upload; PUT is the unbounded fallback.
            // GET/HEAD cover a browser following a presigned download URL.
            AllowedMethods: ['POST', 'PUT', 'GET', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  // eslint-disable-next-line no-console
  console.log(`CORS applied to "${BUCKET}" for:\n  ${origins.join('\n  ')}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Could not apply bucket CORS:', err);
  process.exit(1);
});
