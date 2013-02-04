Fluent Stream
=============
[![Build Status](https://travis-ci.org/rhyzx/node-fluent-stream.png?branch=master)](https://travis-ci.org/rhyzx/node-fluent-stream)

Parsing octet-data from stream/buffer can be painful, this is what **fluent-stream** aiming for.


Quick Example
-------------

```js
var fluent = require('fluent-stream').create()

fluent
    // pop 2 bytes
    .pop(2, function (buf) { 
        console.log(buf)        // log: <Buffer 01 02>
    })
    // async pop
    .pop(1, function (buf, done) { 
        setTimeout(function () {
            console.log(buf)    // log: <Buffer 03>
            done()
        }, 100)
    })

    // unpredictable length
    .pop(1, function (buf) {
        console.log(buf)        // log: <Buffer 04>

        return 2 // next pop length
    })
    .pop(function (buf, done) { // 2 bytes
        console.log(buf)        // log: <Buffer 05 06>

        done(2) // next pop length
    })
    .pop(function (buf) {
        console.log(buf)        // log: <Buffer 07 08>
    })

    // remaining data will be emited(Stream)
    .on('data', function (buf) {
        console.log(buf)        // log: <Buffer 09>
    })

// write or pipe data to it
f.write(new Buffer([0x1, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]))
```

Install
-------

```sh
$ npm install fluent-stream
```


Main Methods
------------

```js
var FluentStream = require('fluent-stream')
```

### var fluent = FluentStream.create([buffer])

- buffer \<Buffer\>

Return a fluent-stream object, it is a duplex stream



### fluent.pop([nbytes,] [callback])

- nbytes \<Number\> : default 1
- callback(buffer, [done]) \<Function\>

Pop n length buffer and exec callback when fluent received enough bytes(>= nbytes)

Discard those data if callback not exists

If callback has more than 1 params, it will be treat as a async callback, you must call done(2nd param) to finish this pop.

If callback return a Number(sync: return *n*, async: done(*n*)), it indicate that next pop action will pop *n* bytes.
This is very useful in handling unpredictable length buffer.



Convience Methods: stash
------------------------

### fluent.stash
There is a 'stash' prop in fluent, it is a Object, all stashed buffers will be stored in it.


### fluent.pop([nbytes,] [stashName])

- nbytes \<Number\> : default 1
- stashName \<String\>

Pop buffer and stash it in 'stash' keyed 'stashName'.


### fluent.apply(callback)

- callback(stash) \<Function\>

Apply stash, you can accese stashed buffers in it, such as `console.log(stash.stashName)`


Convience Methods: read*()
--------------------------

There are a dozen of methods can pre-parse buffer to corresponding types, such as int, float, double

```js
fluent.readInt8(function (value) {
	console.log(value) //log: 1
})
fluent.write(new Buffer([0x01]))
```

They are…

- readUInt8
- readUInt16LE
- readUInt16BE
- readUInt32LE
- readUInt32BE
- readInt8
- readInt16LE
- readInt16BE
- readInt32LE
- readInt32BE
- readFloatLE
- readFloatBE
- readDoubleLE
- readDoubleBE

Details see here [Node Buffer Doc](http://nodejs.org/api/buffer.html#buffer_buf_readuint8_offset_noassert)


### fluent.read*(callback)

- callback(value, [done]) \<Function\>



### fluent.read*(stashName)

- stashName \<String\>


### (TODO)fluent.readString(length, callback)
### (TODO)fluent.readString(length, stashName)

-----------


Stream implementation
---------------------

FluentStream is duplex stream implemented, you can pipe readable stream to it and pipe it to other writable stream.

Fluent will pop buffer of specified length then emit remaining buffer.

eg.
```js
var http = require('http')
  , FluentStream = require('fluent-stream')
http.createServer(function (rep, res) {
	rep.pipe(FluentStream.create()
		.pop(1, function (buf) {
			// do something...
		})
	).pipe(res)
}).listen(8000)
```

----------

LICENSE
-------

MIT
