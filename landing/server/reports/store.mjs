import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

// Private, consistent reads and conditional writes: no process-local database.
export function blobStore(token = process.env.BLOB_READ_WRITE_TOKEN) {
  const options = { token, access: "private", abortSignal: AbortSignal.timeout(15000) };
  return {
    async read(key) {
      const result = await get(key, { ...options, abortSignal: AbortSignal.timeout(15000), useCache: false });
      if (!result) return null;
      if (result.statusCode !== 200 || !result.stream || result.blob.size > 512000)
        throw new Error("Invalid private state");
      return { value: await new Response(result.stream).json(), version: result.blob.etag };
    },
    async write(key, value, version) {
      try {
        await put(key, JSON.stringify(value), {
          ...options,
          abortSignal: AbortSignal.timeout(15000),
          contentType: "application/json",
          addRandomSuffix: false,
          cacheControlMaxAge: 60,
          ...(version ? { ifMatch: version } : { allowOverwrite: false }),
        });
        return true;
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) return false;
        if (!version && (await this.read(key))) return false;
        throw error;
      }
    },
  };
}

export async function update(store, key, initial, change) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await store.read(key);
    const value = current ? structuredClone(current.value) : structuredClone(initial);
    const result = await change(value);
    if (await store.write(key, value, current?.version)) return result;
  }
  const error = new Error("El servicio está ocupado. Vuelve a intentarlo.");
  error.status = 503;
  error.public = true;
  throw error;
}
