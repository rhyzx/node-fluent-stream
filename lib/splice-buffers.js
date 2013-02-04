// help functions
// splice buffers array

module.exports = function (buffers, nbytes) {
    var bufs = []
      , buf

    while (nbytes > 0) {
        //nbytes -= bufs[bufs.push(buffers.shift()) - 1].length
        buf = buffers.shift()
        nbytes -= buf.length
        bufs.push(buf)
    }

    if (nbytes < 0) {
        nbytes = buf.length + nbytes
        buffers.unshift(
            buf.slice(nbytes)
        )

        bufs.pop()
        bufs.push(buf.slice(0, nbytes))
    }
    

    return Buffer.concat(bufs/*, nbytes*/) // nbytes less than buf cause Error
}
