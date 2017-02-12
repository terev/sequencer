const peg = require('pegjs');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const test_files = [{name: 'test.seq'}];
const Canvas = require('canvas');
let parser;
var crypto = require('crypto');

function toPng(seq) {
	const canvas = new Canvas(800, 600);
	const ctx = canvas.getContext('2d');
	const out = fs.createWriteStream(__dirname + '/diagram.png');
	const stream = canvas.pngStream();
	ctx.font = '30px Impact';

	stream.on('data', function(chunk){
		out.write(chunk);
	});
	stream.on('end', function(){
		console.log('saved png');
	});

	let participants = {};
	let x = 10;
	_.each(seq, thing => {
		if(thing.type == 'interaction') {
			if(!_.has(participants, thing.left)) {
				let size = ctx.measureText(thing.left);
				let lifeline = x + size.width / 2;

				ctx.fillStyle = '#09F';
				ctx.fillRect(x, 100 - size.emHeightAscent, size.width, size.emHeightAscent);
				participants[thing.left] = {x: x};
				ctx.fillStyle = '#FFFFFF';
				ctx.fillText(thing.left, x, 100);
				ctx.beginPath();
				ctx.moveTo(lifeline, 100);
				ctx.lineTo(lifeline, 800);
				ctx.stroke();
				ctx.closePath();
				x += size.width + 10;
			}
			if(!_.has(participants, thing.right)) {
				let size = ctx.measureText(thing.right);
				let lifeline = x + size.width / 2;

				ctx.fillStyle = '#09F';
				ctx.fillRect(x, 100 - size.emHeightAscent, size.width, size.emHeightAscent);
				participants[thing.right] = {x: x};
				ctx.fillStyle = '#FFFFFF';
				ctx.fillText(thing.right, x, 100);
				ctx.beginPath();
				ctx.moveTo(lifeline, 100);
				ctx.lineTo(lifeline, 800);
				ctx.stroke();
				ctx.closePath();
				x += size.width + 10;
			}
		}
	});
}

function getParser(contents) {
	return peg.generate(contents.toString(), {optimize: 'speed'});
}

fs.readFileAsync('latest').then((latest) => {
	return fs.readFileAsync('sequence.pegjs').then(contents => {
		var md5sum = crypto.createHash('md5');
		let hash = md5sum.update(contents.toString()).digest('hex');
		
		if(latest.toString() !== hash) {
			fs.writeFileSync('latest', hash);
			fs.writeFileSync('source.js', peg.generate(contents.toString(), {optimize: 'speed', output: 'source', format: 'commonjs'}));
			parser = peg.generate(contents.toString(), {optimize: 'speed'});
			console.log('regenerated parser');
		} else {
			parser = require('./source');
			console.log('from cache');
		}

		return parser;
	})
})
.then(parser => {
	return Promise.map(test_files, file => {
		return fs.readFileAsync(file.name)
			.then(contents => {
				let parsed = parser.parse(contents.toString());
				console.log(parsed);
				toPng(parsed);
			});
	});
});