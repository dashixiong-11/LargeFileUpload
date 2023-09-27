const fs = require("fs")
const path = require("path")

 function renameFile(dir,oldName,newName){
    const oldPath = path.resolve(dir,oldName)
    const newPath = path.resolve(dir,newName)
    fs.renameSync(oldPath,newPath)
}
 const mergeChunkFile = (fileName,chunkPath,chunkCount,fileToken,dataDir="./")=>{
    //如果chunkPath 不存在 则直接结束
    if(!fs.existsSync(chunkPath)) return
    const dataPath = path.join(__dirname,dataDir,fileName);
    let writeStream = fs.createWriteStream(dataPath);
    let mergedChunkNum = 0
    return mergeCore()
    //闭包保存非递归数据
    function mergeCore(){
        //结束标志为已合并数量大于总数（mergedChunkNum从0开始）
        if (mergedChunkNum >= chunkCount) return
        const curChunk = path.resolve(chunkPath,`${fileName}-${mergedChunkNum}-${fileToken}`)
        const curChunkReadStream = fs.createReadStream(curChunk);
        //将readStream 写入 writeStream
        curChunkReadStream.pipe(writeStream, { end: false }); //end = false 则可以连续给writeStream 写数据
        curChunkReadStream.on("end", () => {
            //readStream 传输结束 则 递归 进行下一个文件流的读写操作
            fs.unlinkSync(curChunk) //删除chunkFile
            mergedChunkNum += 1
            mergeCore();
        });
    }
}
module.exports = {
    renameFile,mergeChunkFile
}
