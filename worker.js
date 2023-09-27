import { createChunk } from "./createChunk.js";

onmessage = async e => {
    const { file, CHUNK_SIZE, startIndex, endIndex, chunkCount } = e.data
    const proms = []
    for (let i = startIndex; i < endIndex; i++) {
        proms.push(createChunk(file, i, CHUNK_SIZE, chunkCount))
    }
    const chunks = await Promise.all(proms)
    postMessage(chunks)
}