const uploadFile = (url, data,cb) => {
    return new Promise((resolve, reject) => {
        const http = new XMLHttpRequest()
        http.open('POST', url, true)
        http.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            // const percentComplete = (event.loaded / event.total) * 100;
            // console.log(`${percentComplete}%`);
            // console.log(`${percentComplete.toFixed(2)}%`);
            cb({fileName:data.get('name'),fileSize:data.get('fileSize'),loadedSize:event.loaded})
          }
        });
        http.onreadystatechange = function () {
            if (http.readyState === 4) {
                if (http.status === 200) {
                    resolve({
                        code:http.status,
                        message:http.responseText
                    })
                }else{
                    reject(http.responseText)
                }
            }
        }
        http.send(data)
    })
}

export { uploadFile}