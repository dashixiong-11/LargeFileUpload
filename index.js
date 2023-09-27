import { watch } from './watch.js'
import { uploadFile } from './post.js';
import { throttle } from './throttle.js'
import { createChunk } from "./createChunk.js";
import sendRequest from './processRequests.js';
const CHUNK_SIZE = 1025 * 1025 * 5 //5MB
const THREAD_COUNT = 4
const cutFile = async file => {
    let finishCount = 0
    return new Promise(resolve => {
        const result = []
        const chunkCount = Math.ceil(file.size / CHUNK_SIZE)
        if (chunkCount === 1) {
            createChunk(file, 0, file.size, chunkCount).then(res => {
                resolve([res])
            })
            return
        }
        const workChunkCount = Math.ceil(chunkCount / THREAD_COUNT)
        for (let i = 0; i < THREAD_COUNT; i++) {
            const startIndex = i * workChunkCount
            let endIndex = startIndex + workChunkCount
            if (endIndex > chunkCount) {
                endIndex = chunkCount
            }
            const worker = new Worker('./worker.js', {
                type: 'module'
            })
            worker.postMessage({ file, CHUNK_SIZE, startIndex, endIndex, chunkCount })
            worker.onmessage = e => {
                for (let i = startIndex; i < endIndex; i++) {
                    result[i] = e.data[i - startIndex]
                }
                worker.terminate()
                finishCount++
                if (finishCount === THREAD_COUNT) {
                    resolve(result)
                }
            }
        }
    })
}



const ul = document.querySelector('#file-list')
const createLi = child => {
    const li = document.createElement('li');
    if (Object.prototype.toString.call(child) === '[object Array]') {
        child.forEach(c => {
            li.appendChild(c)
        })
    } else {
        li.appendChild(child)
    }

    return li
}
const createDiv = (content) => {
    const div = document.createElement('text');
    div.textContent = content;
    return div
}

const upFile = async file => {
    const chunks = await cutFile(file)
    sendRequest(chunks,4)
}

const fileList = watch([], throttle(data => {
    data.forEach(item => {
        const div1 = createDiv(item.name)
        const div2 = createDiv(`0/${item.size}`)
        const li = createLi([div1, div2])
        ul.appendChild(li)
        console.log('item',item);
        upFile(item)
    })
}, 200))

const getFile = (entry) => {
    if (entry.isFile) {
        entry.file(f => {
            fileList.push(f)
        })
    } else if (entry.isDirectory) {
        const reader = entry.createReader()
        reader.readEntries(entries => {
            for (const entry of entries) {
                getFile(entry)
            }
        })
    }
}

const inputs = document.querySelectorAll('input[type="file"]')
const drag = document.querySelector('#upload-area')
drag.ondragenter = (e) => {
    e.preventDefault()
}
drag.ondragover = (e) => {
    e.preventDefault()
}
drag.ondrop = (e) => {
    e.preventDefault()
    const items = e.dataTransfer.items
    for (const item of items) {
        const entry = item.webkitGetAsEntry()
        getFile(entry)
    }
}


inputs.forEach(input => {
    input.onchange = async e => {
        const files = e.target.files
        if (files.size === 0) return
        fileList.push(...files)
    }
})

const p = async (name, chunks, fileIndex) => {
    let i = fileIndex
    if (!chunks[i]) {
        console.log('上传完毕');
        return
    }
    const { hash, index, chunkCount, fileChunk,fileSize,start,end } = chunks[i]
    console.log({ hash, index, chunkCount, fileChunk,fileSize,start,end });
    const formData = new FormData();
    formData.append("name", name);
    formData.append("total", chunkCount);
    formData.append("index", index);
    formData.append("start", start);
    formData.append("end", end);
    formData.append("hash", hash);
    formData.append("fileSize", fileSize);
    formData.append("fileChunk", fileChunk);

    uploadFile('http://localhost:3001/upload', formData,({fileName,fileSize,loadedSize})=>{
        console.log(`${fileName}: ${loadedSize}/${fileSize}`);
    })
        .then(response => {
            i++
            // 请求成功，处理响应数据
            p(name, chunks, i)
        })
        .catch(error => {
            // 请求失败，处理错误
            console.error('请求失败：', error);
        });
}

