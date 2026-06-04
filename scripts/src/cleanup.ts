import { pool } from "@workspace/db";

async function cleanup() {
  console.log("Cleaning up duplicate artisans and events...");

  const client = await pool.connect();
  try {
    // ── ARTISANS ──────────────────────────────────────────
    const keepArtRes = await client.query(
      `SELECT MIN(id) AS id, name FROM artisans GROUP BY name`
    );
    const keepArtisanIds: number[] = keepArtRes.rows.map((r: any) => Number(r.id));
    console.log("Keeping artisan ids:", keepArtisanIds);

    const allArtRes = await client.query(`SELECT id, name FROM artisans`);
    const deleteArtisanIds: number[] = allArtRes.rows
      .map((r: any) => Number(r.id))
      .filter((id: number) => !keepArtisanIds.includes(id));
    console.log("Deleting artisan ids:", deleteArtisanIds);

    if (deleteArtisanIds.length > 0) {
      for (const dup of allArtRes.rows.filter((r: any) =>
        deleteArtisanIds.includes(Number(r.id))
      )) {
        const canonical = keepArtRes.rows.find((r: any) => r.name === dup.name);
        if (canonical) {
          await client.query(
            `UPDATE products SET artisan_id = $1 WHERE artisan_id = $2`,
            [Number(canonical.id), Number(dup.id)]
          );
          console.log(`  Remapped products: artisan ${dup.id} → ${canonical.id} (${dup.name})`);
        }
      }
      await client.query(
        `DELETE FROM artisans WHERE id = ANY($1::int[])`,
        [deleteArtisanIds]
      );
      console.log(`Deleted ${deleteArtisanIds.length} duplicate artisans`);
    } else {
      console.log("No duplicate artisans to delete");
    }

    // ── EVENTS ────────────────────────────────────────────
    const keepEvtRes = await client.query(
      `SELECT MIN(id) AS id FROM events GROUP BY regexp_replace(slug, '-[0-9]+$', '')`
    );
    const keepEventIds: number[] = keepEvtRes.rows.map((r: any) => Number(r.id));
    console.log("Keeping event ids:", keepEventIds);

    const allEvtRes = await client.query(`SELECT id FROM events`);
    const deleteEventIds: number[] = allEvtRes.rows
      .map((r: any) => Number(r.id))
      .filter((id: number) => !keepEventIds.includes(id));
    console.log("Deleting event ids:", deleteEventIds);

    if (deleteEventIds.length > 0) {
      await client.query(
        `DELETE FROM events WHERE id = ANY($1::int[])`,
        [deleteEventIds]
      );
      console.log(`Deleted ${deleteEventIds.length} duplicate events`);
    } else {
      console.log("No duplicate events to delete");
    }

    // Normalise event slugs — strip timestamp suffix
    const normRes = await client.query(
      `UPDATE events SET slug = regexp_replace(slug, '-[0-9]+$', '') WHERE slug ~ '-[0-9]+$' RETURNING id, slug`
    );
    if (normRes.rowCount && normRes.rowCount > 0) {
      normRes.rows.forEach((r: any) => console.log(`  Normalised slug id=${r.id}: ${r.slug}`));
    }
    console.log("Event slugs normalised");

    console.log("Cleanup complete!");
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

cleanup().catch(err => {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
});
