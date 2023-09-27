
import { postImg} from './post.js'
export function createLimitPromise(limitNum, promiseListRaw) {
    let resArr = [];
    let handling = 0;
    let resolvedNum = 0;
    let promiseList = [...promiseListRaw]
    let runTime =  promiseListRaw.length

    return new Promise(resolve => {
        //并发执行limitNum 次
        for (let i = 1; i <= limitNum; i++) {
            run();
        }

        function run() {
            if(!promiseList.length) return
            handling += 1;
            console.log("cur handling:" + handling)
            handle(promiseList.shift()) .then(res => { resArr.push(res); }) .catch(e => {
                    console.log("catch error");
                })
                .finally(() => {
                    handling -= 1;
                    resolvedNum += 1;
                    console.log(`resolvedNum : ${resolvedNum}`);
                    if(resolvedNum === runTime){
                        resolve(resArr)
                    }
                    run();
                });
        }
        function handle(promise) {
            return new Promise((resolve, reject) => {
                promise.then(res => resolve(res)).catch(e => reject(e));
            });
        }
    });
}

//分片二进制数据
export function sliceFile(file, chunkSize) {
    let chunkList = [];
    let start = 0;
    let end = chunkSize;
    while (true) {
        let curChunk = file.slice(start, end);
        if (!curChunk.size) break;
        chunkList.push(curChunk);
        start += chunkSize;
        end = start + chunkSize;
    }
    return chunkList;
}

//获取HTML 中的file对象
export function getElFile(selector) {
    return document.querySelector(selector).files[0];
}

//chunkList => formdata list => PromiseList
//切片数组 封装成 http 请求
export function createChunkPromiseList(chunkList, name, TOKEN) {
    return chunkList
        .map((chunk, index) => {
            let formdata = new FormData();
            formdata.append("type", "upload");
            formdata.append("name", name);
            formdata.append("token", TOKEN);
            formdata.append("chunk", chunk);
            formdata.append("index", index);
            return formdata;
        }).map(formdata => {
            return postImg('http://localhost:3001/upload', formdata);
        });
}




