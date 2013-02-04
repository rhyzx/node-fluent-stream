var Stream  = require('stream')
  , util    = require('util')
  , splice  = require('./lib/splice-buffers')
  

util.inherits(FluentStream, Stream)
function FluentStream(buf) {
    Stream.call(this)

    this.nbytes = 0
    this.ended  = false
    this.stash  = {}
    this.queued = [] // queued actions for poping
    this.buffers= []

    if (Buffer.isBuffer(buf)) {
        this.nbytes += buf.length
        this.buffers.push(buf)

        var self = this
        process.nextTick(function () {
            self.process() // start pop & flush
        })
    }
}


//FluentStream.prototype.nbytes = 0
//FluentStream.prototype.ended = false
//FluentStream.prototype.stash = {}
//FluentStream.prototype.queued = {}
//FluentStream.prototype.buffers = []

FluentStream.prototype.pop = function (nbytes, action /*,preserve*/) {
    if (typeof nbytes !== 'number') {
        action = nbytes
        nbytes = 1 // nbytes to pop, default 1
    }

    this.queued.push({
        nbytes: nbytes
      , action: action
    })
    this.process()
    return this // chain op
}
FluentStream.prototype.apply = function (callback) {
    this.pop(0, callback)
    return this // chain op
}
FluentStream.prototype.process = function () {
    if (this.waiting) return

    if (!this.queued.length) return this.flush()
    if (this.queued[0].nbytes > this.nbytes) return


    var pop     = this.queued.shift()
      , nbytes  = pop.nbytes
      , action  = pop.action
      , buf     = (nbytes !== 0)
                    ? splice(this.buffers, nbytes)
                    : this.stash

    this.nbytes -= nbytes

    if (typeof action === 'string') { // stash it
        this.stash[action] = buf
        this.process()
    } else if (typeof action === 'function') { // exec it
        if (action.length > 1) { // arguments with async callback
            var self = this
            self.waiting = true
            action.call(self, buf, function (nextnbytes) {
                if (self.queued[0] && typeof nextnbytes === 'number') {
                    self.queued[0].nbytes = nextnbytes
                }
                self.waiting = false
                self.process()
            })
        } else {
            var nextnbytes = action(buf)
            if (this.queued[0] && typeof nextnbytes === 'number') {
                this.queued[0].nbytes = nextnbytes
            }
            this.process()
        }
    } // else discard it
}
FluentStream.prototype.flush = function () {
    var buffers = this.buffers
      , encoding = this.encoding
      , buf

    var self = this
    !(function loop() {
        //if (self.paused) return
        if (buf = buffers.shift()) {
            self.nbytes -= buf.length
            self.emit('data', 
                typeof encoding === 'string'
                    ? buf.toString(encoding)
                    : buf
            )

            process.nextTick(loop)
        } else if (self.ended) {
            self.emit('end')
        }
    })()
}


// Stream implementation
FluentStream.prototype.writable = true
FluentStream.prototype.readable = true

FluentStream.prototype.write = function (chunk, encoding) {
    if (!Buffer.isBuffer(chunk)) chunk = new Buffer(chunk, encoding)

    this.nbytes += chunk.length
    this.buffers.push(chunk)
    this.process()

    return true
}
FluentStream.prototype.end = function (chunk, encoding) {
    this.ended = true

    if (!chunk) return this.process()
    this.write.apply(this, arguments)
}
FluentStream.prototype.setEncoding = function (encoding) {
    this.encoding = (typeof encoding === 'string')
                    ? encoding
                    : 'utf8'
}
//FluentStream.prototype.paused = false
//FluentStream.prototype.pause = function () {
//   this.paused = true
//}
//FluentStream.prototype.resume = function () {
//   this.paused = false
//   this.process()
//}
//FluentStream.prototype.destory = function () {}
//FluentStream.prototype._decoder = function () {} ?use decoder instead




// convenience methods
// wrap Buffer's read* methods
var re = /^read\D*(\d+)/
Object.keys(Buffer.prototype).forEach(function (method) {
    var nbytes
    if ( !(nbytes = re.exec(method)) ) return

    nbytes = nbytes[1] / 8
    FluentStream.prototype[method] = function (action /*,preserve*/) {
        this.queued.push({
            nbytes: nbytes
          , action: typeof action === 'string'
                ? function (buf) {
                    this.stash[action] = buf[method](0)
                }
                : action.length > 1
                ? function (buf, callback) {
                    action(buf[method](0), callback)
                }
                : function (buf) {
                    action(buf[method](0))
                }
          //, action: action
          //, method: method
        })
        this.process()
        return this // chain op
    }
})
//FluentStream.prototype.readString = function (action /*,preserve*/) {}

// exports
module.exports 
    = exports.FluentStream
    = exports = FluentStream
exports.create = function (buf) {
    return new FluentStream(buf)
}
