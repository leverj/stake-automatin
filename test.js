const cp = require('child_process');
const process = require('process');
const testrpc = require('./test/testrpc');

testrpc.start().then(truffleTest);
function truffleTest() {
  const truffle = cp.spawn('truffle', ['test']);

  truffle.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });

  truffle.stderr.on('data', (data) => {
    process.stdout.write(data.toString());
  });

  truffle.on('exit', (code) => {
    process.exit(code);
  })
}

