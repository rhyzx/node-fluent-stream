var Fluent = require('../')

describe('Basic test', function () {
    it('should emit data with no pop added(#constructor)', function (done) {
        var fluent = Fluent.create(new Buffer([0x00]))
        fluent.on('data', function (buf) {
            buf.should.eql(new Buffer([0x00]))
            done()
        })
    })

    it('should emit data with no pop added', function (done) {
        var fluent = Fluent.create()
        fluent.on('data', function (buf) {
            buf.should.eql(new Buffer([0x00]))
            done()
        })

        fluent.write(new Buffer([0x00]))
    })

    it('should pop buffer', function (done) {
        var fluent = Fluent.create()
        fluent.pop(function (buf) {
            buf.should.eql(new Buffer([0x01]))
            done()
        })
        fluent.write(new Buffer([0x01]))
    })
})


describe('Complete test', function () {
    var fluent = Fluent.create()

    it('should pop without error', function (done) {
        fluent.pop(2, function (buf) {
            buf.should.eql(new Buffer([0x01, 0x02]))
            return 3
        }).pop(function (buf, finish) { // length 3 from prev
            setTimeout(function () {
                buf.should.eql(new Buffer([0x03, 0x04, 0x05]))
                finish(2)
            }, 100)
        }).pop(function (buf) { // length 2 from prev
            buf.should.eql(new Buffer([0x06, 0x07]))
        }).pop(function (buf) { // default 1
            buf.should.eql(new Buffer([0x08]))
        }).on('data', function (buf) { // emit remain data
            buf.should.eql(new Buffer([0x09]))
            done()
        })

        fluent.write(new Buffer([0x01, 0x02, 0x03]))
        fluent.write(new Buffer([0x04, 0x05, 0x06]))
        fluent.write(new Buffer([0x07, 0x08, 0x09]))
    })
})


describe('Stash test', function () {
    var fluent = Fluent.create()

    it('should stash correct value', function (done) {
        fluent
            .pop(2, 'valuea')
            .pop(3, 'valueb')
            .pop(3, 'valuec')
            .apply(function (stash) {
                stash.valuea.should.eql(new Buffer([0x01, 0x02]))
                stash.valueb.should.eql(new Buffer([0x03, 0x04, 0x05]))
                stash.valuec.should.eql(new Buffer([0x06, 0x07, 0x08]))

                fluent.stash.should.equal(stash)
            })
            .on('data', function (buf) {
                buf.should.eql(new Buffer([0x09]))
                done()
            })

        fluent.write(new Buffer([0x01, 0x02, 0x03]))
        fluent.write(new Buffer([0x04, 0x05, 0x06]))
        fluent.write(new Buffer([0x07, 0x08, 0x09]))
    })
})


describe('Convenience methods test', function () {
    var fluent = Fluent.create()

    it('should return corresponding values', function (done) {
        fluent.readInt8(function (v) {
            v.should.equal(8)
            //done()
        })
        fluent.write(new Buffer([0x08]))


        fluent.readUInt16LE(function (v) {
            v.should.equal(5)
            done()
        })
        var buffer = new Buffer(2)
        buffer.writeUInt16LE(5, 0)
        fluent.write(buffer)
    })

    it.skip('should return string', function (done) {
        var fluent = Fluent.create()
        fluent.readString(function (buf) {
            buf.should.eql(new Buffer([0x01]))
            done()
        })
        fluent.write(new Buffer([0x01]))
    })
})


var fs = require('fs')
describe('Stream implementaion test', function () {
    it('should pop buffer with specifed length', function (done) {
        var fluent      = Fluent.create()
          , readStream  = fs.createReadStream(__dirname +'/file/123.txt')

        fluent.pop(1, function (buf) {
            buf.should.eql(new Buffer('1'))
        }).pop(1, function (buf) {
            buf.should.eql(new Buffer('2'))
        }).on('data', function (buf) {
            buf.should.eql(new Buffer('3'))
            done()
        })
        readStream.pipe(fluent)
    })
})
