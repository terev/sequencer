const peg = require('pegjs');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const Canvas = require('canvas');
let parser;
const crypto = require('crypto');

function createParticipant(canvas, ctx, position, participant, participants) {
    let size = ctx.measureText(participant);
    let lifeline = position.x + size.width / 2;

    ctx.fillStyle = '#09F';
    ctx.fillRect(position.x, position.y, size.width, size.emHeightAscent);
    participants[participant] = {x: position.x};
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(participant, position.x, position.y + size.emHeightAscent);
    ctx.beginPath();
    ctx.moveTo(lifeline, position.y + size.emHeightAscent);
    ctx.lineTo(lifeline, canvas.height);
    ctx.stroke();
    ctx.closePath();
    position.x += size.width + 10;
}

module.exports.draw = function (seq, width, height) {
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.font = '20px Impact';
    ctx.antialias = 'gray';

    let participants = {};
    let position = {x: 10, y: 10};
    _.each(seq, thing => {
        if (thing.type == 'interaction') {
            if (!_.has(participants, thing.left)) {
                createParticipant(canvas, ctx, position, thing.left, participants);
            }

            if (!_.has(participants, thing.right)) {
                createParticipant(canvas, ctx, position, thing.right, participants);
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