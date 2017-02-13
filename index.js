const peg = require('pegjs');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const Canvas = require('canvas');
let parser;
const crypto = require('crypto');

module.exports.draw = function (seq, width, height) {
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.font = '20px Impact';
    ctx.antialias = 'gray';

    let participants = {};
    let x = 10;
    let y = 10;
    _.each(seq, thing => {
        if (thing.type == 'interaction') {
            if (!_.has(participants, thing.left)) {
                let size = ctx.measureText(thing.left);
                let lifeline = x + size.width / 2;

                console.log(size);

                ctx.fillStyle = '#09F';
                ctx.fillRect(x, y, size.width, size.emHeightAscent);
                participants[thing.left] = {x: x};
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(thing.left, x, y + size.emHeightAscent);
                ctx.beginPath();
                ctx.moveTo(lifeline, y + size.emHeightAscent);
                ctx.lineTo(lifeline, height);
                ctx.stroke();
                ctx.closePath();
                x += size.width + 10;
            }
            if (!_.has(participants, thing.right)) {
                let size = ctx.measureText(thing.right);
                let lifeline = x + size.width / 2;

                ctx.fillStyle = '#09F';
                ctx.fillRect(x, y, size.width, size.emHeightAscent);
                participants[thing.right] = {x: x};
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(thing.right, x, y + size.emHeightAscent);
                ctx.beginPath();
                ctx.moveTo(lifeline, y + size.emHeightAscent);
                ctx.lineTo(lifeline, height);
                ctx.stroke();
                ctx.closePath();
                x += size.width + 10;
            }
        }
    });

    return canvas;
};

module.exports.parse = function (sequence) {
    return Promise.try(() => {
        return parser.parse(sequence);
    });
};

function fromCache() {
    let parser = require(__dirname + '/source');
    console.log('loaded from cache');
    return parser;
}

function loadParser(hash, contents) {
    fs.writeFileSync(__dirname + 'latest', hash);
    fs.writeFileSync(__dirname + 'source.js', peg.generate(contents.toString(), {
        optimize: 'speed',
        output: 'source',
        format: 'commonjs'
    }));
    parser = peg.generate(contents.toString(), {optimize: 'speed'});
    console.log('regenerated parser');
}

fs.readFileAsync(__dirname + '/sequence.pegjs').then(contents => {
    const md5sum = crypto.createHash('md5');
    let hash = md5sum.update(contents.toString()).digest('hex');

    return fs.accessAsync(__dirname + '/latest', fs.constants.R_OK | fs.constants.W_OK)
        .then(() => {
            return fs.readFileAsync(__dirname + '/latest').then((latest) => {
                if (latest.toString() === hash) {
                    parser = fromCache();
                } else {
                    parser = loadParser(hash, contents);
                }
            });
        })
        .catch((err) => {
            console.log(err);
            parser = loadParser(hash, contents);
            return Promise.resolve(parser);
        });
});