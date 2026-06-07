---
name: Object Storage Setup
description: How image uploads are handled in Gorilla Guardians — Replit App Storage replaces local /uploads folder.
---

Images are stored in Replit App Storage (GCS bucket: `replit-objstore-7066ae9a-dfdb-4dba-8e10-84b84c2ab7b3`).
Provisioned via `setupObjectStorage()` in code_execution sandbox on 2026-06-07.

## Upload flow
1. Client POSTs JSON metadata to `/api/storage/uploads/request-url` → gets `{ uploadURL, objectPath }`
2. Client PUTs file bytes directly to `uploadURL` (GCS presigned URL — goes to GCS, NOT the API server)
3. Client stores `/api/storage${objectPath}` as the image URL in the DB

## Serving
Images served via `GET /api/storage/objects/<uuid>` (streams from GCS).

## Key files
- Server lib: `artifacts/api-server/src/lib/objectStorage.ts` + `objectAcl.ts`
- Server route: `artifacts/api-server/src/routes/storage.ts`
- Frontend: `artifacts/gorilla-guardians/src/components/ui/image-upload.tsx` (presigned URL flow)

## Root cause of original failure
`setupObjectStorage()` had never been called — bucket didn't exist, `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS` / `DEFAULT_OBJECT_STORAGE_BUCKET_ID` env vars were all unset.
Every presigned URL request threw "PRIVATE_OBJECT_DIR not set" → 500 → "Upload failed, try again".
Fix: call `setupObjectStorage()`, restart both workflows. No code changes needed.

**Why:** Local `/uploads` folder is ephemeral on Replit — files lost after restart/redeploy. GCS is permanent.

**How to apply:** Any new image upload feature should use POST `/api/storage/uploads/request-url` + PUT to presigned URL, not multer/diskStorage. If uploads fail again, first check that the env vars are still set.
