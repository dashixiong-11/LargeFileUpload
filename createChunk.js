import { SparkMD5 } from './spark-md5.js'
export function createChunk(file, index, chunkSize, chunkCount) {
    return new Promise((resolve, reject) => {
        const start = index * chunkSize
        const end = start + chunkSize > file.size ? file.size : start + chunkSize
        const spark = new SparkMD5.ArrayBuffer()
        const fileReader = new FileReader()
        const fileChunk = file.slice(start, end)
        fileReader.onload = (e) => {
            spark.append(e.target.result)
            resolve({ chunkCount, index, start, end, hash: spark.end(), fileChunk, fileSize: file.size, fileName: file.name })
        }
        fileReader.readAsArrayBuffer(fileChunk)
    })
}
