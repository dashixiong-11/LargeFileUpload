const Koa = require("koa");
const path = require('path')
const Router = require('koa-router')
const fs = require("fs");
const multer = require('@koa/multer');

const app = new Koa();
const router = new Router()
const uploadChunkPath = path.resolve(__dirname, './data')

if (!fs.existsSync(uploadChunkPath)) {
    fs.mkdirSync(uploadChunkPath);
}

const upload = multer()


app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (ctx.method == 'OPTIONS') {
        ctx.body = 200;
    } else {
        await next();
    }
});

function mergeChunks(filePath, totalChunks) {
    const writeStream = fs.createWriteStream(filePath);
    for (let i = 0; i < totalChunks; i++) {
        const chunkFilePath = `${filePath}_${i}.dat`;
        const readStream = fs.createReadStream(chunkFilePath);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', () => {
            fs.unlinkSync(chunkFilePath); // 删除已合并的分片文件
        });
    }
}

const fileChunkCountMap = new Map()
const chunkDataMap = new Map();
function combineChunks(filename) {
    console.log('combineChunks', filename);
    const filePath = path.join(uploadChunkPath, filename);
    const writeStream = fs.createWriteStream(filePath);
    console.log(chunkDataMap.get(filename));
    chunkDataMap.get(filename).forEach((data) => {
        writeStream.write(data);
    });

    writeStream.end();
    chunkDataMap.delete(filename);
}

router.post('/upload', upload.single('fileChunk'), function (ctx) {
    const { hash, name, index, total } = ctx.request.body
    console.log(ctx.request.body);
    const { file } = ctx.request
    const fileName = `${name}`; // 构建分片文件名
    const filePath = path.join(uploadChunkPath, fileName);
    fs.writeFileSync(`${filePath}_${index}.dat`, file.buffer);
    fileChunkCountMap.set(name, fileChunkCountMap.get(name) ? fileChunkCountMap.get(name) + 1 : 1)
    // const map = chunkDataMap.get(name) || new Map()
    // map.set(hash, file.buffer)
    // !chunkDataMap.has(name) && chunkDataMap.set(name, map)
    // const chunkFilePath = `${filePath}.part${index}`;

    console.log(fileChunkCountMap.get(name),total);
    if (fileChunkCountMap.get(name) >= parseInt(total)) {
        //   combineChunks(name)
        mergeChunks(filePath, total)
        fileChunkCountMap.delete(name)
    }
    ctx.body = 200
})

app.use(router.routes())
app.listen(3001, 'localhost', function () {
    console.log('server is running at port 3001...');
});