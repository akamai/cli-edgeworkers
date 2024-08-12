const { exec } = require('node:child_process');
const nodeEnvironment = process.env.NODE_ENV;

if (nodeEnvironment !== 'production') {
  exec('npm run build', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
  });
}