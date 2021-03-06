/*global describe, it, setImmediate*/
var expect = require('unexpected'),
    MockRequest = require('../lib/MockRequest'),
    ReadableStream = require('stream').Readable,
    passError = require('passerror');

describe('MockRequest', function () {
    it('should play back a single request/response pair', function (done) {
        var request = new MockRequest({
            request: {
                method: 'POST',
                url: '/blah'
            },
            response: {
                headers: {
                    'Content-Type': 'text/html'
                },
                body: 'hey'
            }
        });

        request.post('/blah', passError(done, function (response, body) {
            expect(response, 'to have properties', {
                headers: {
                    'content-type': 'text/html'
                }
            });
            expect(body, 'to equal', 'hey');
            done();
        }));
    });

    it('should play back multiple request/response pairs', function (done) {
        var request = new MockRequest([
            {
                request: 'GET /foo',
                response: 'the foo'
            },
            {
                request: 'GET /bar',
                response: 'the bar'
            }
        ]);

        request.get('/foo', passError(done, function (response, body) {
            expect(body, 'to equal', 'the foo');
            request.get('/bar', passError(done, function (response, body) {
                expect(body, 'to equal', 'the bar');
                done();
            }));
        }));
    });

    describe('with the response provided as an Error instance', function () {
        it('should pass the error to the callback', function (done) {
            var request = new MockRequest({
                request: 'POST /blah',
                response: new Error('ETIMEDOUT')
            });

            request.post('/blah', function (err, response, body) {
                expect(err, 'to equal', new Error('ETIMEDOUT'));
                done();
            });
        });

        it('should not emit the response event', function (done) {
            var request = new MockRequest({
                request: 'POST /blah',
                response: new Error('ETIMEDOUT')
            });

            request
                .post('/blah')
                .on('response', function () {
                    done(new Error('response event emitted'));
                })
                .on('error', function (err) {
                    expect(err, 'to equal', new Error('ETIMEDOUT'));
                    setImmediate(done);
                });
        });
    });

    it.skip('should allow specifying the response body as a readable stream', function (done) {
        var readableStream = new ReadableStream();
        readableStream._read = function () {
            setImmediate(function () {
                readableStream.push('foo');
                setImmediate(function () {
                    readableStream.push(null);
                });
            });
        };
        var request = new MockRequest({
            request: 'POST /blah',
            response: readableStream
        });

        request.post('/blah', passError(done, function (response, body) {
            expect(body, 'to equal', 'foo');
            done();
        }));
    });
});
