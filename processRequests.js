import { uploadFile } from "./post.js";

const p = (chunk) => {
    const { hash, index,start,end, chunkCount, fileChunk, fileSize, fileName } = chunk
    const formData = new FormData();
    formData.append("name", fileName);
    formData.append("total", chunkCount);
    formData.append("start", start);
    formData.append("end", end);
    formData.append("index", index);
    formData.append("hash", hash);
    formData.append("fileSize", fileSize);
    formData.append("fileChunk", fileChunk);

 return  uploadFile('http://localhost:3001/upload', formData, ({ fileName, fileSize, loadedSize }) => {
        console.log(`${fileName}-${index}: ${fileChunk.size} total: ${loadedSize}/${fileSize}`);
    });
}

const sendRequest = (chunks, limit) => {
    const pool = new Set()
    const waitQueue = []
    const processRequests = (chunk) => {
        return new Promise((resolve, reject) => {
            const isFull = pool.size >= limit
            const fn = function fn() {
              const request =  p(chunk)
                request.then(resolve)
                request.catch(reject)
                request.finally(()=>{
                    pool.delete(fn)
                    const next = waitQueue.shift()
                    next && pool.add(next)
                    setTimeout(()=> next?.())
                })
                return request
            }
            if(isFull){
                waitQueue.push(fn)
            }else {
                pool.add(fn)
                fn()
            }
        })
    }
    for(const chunk of chunks){
        processRequests(chunk).then( res => {
            console.log(res);
        })
    }
}


export default sendRequest
