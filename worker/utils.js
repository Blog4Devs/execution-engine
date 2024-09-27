const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const execShellCommand = (cmd, options = {}) => {
  let error ;
  return new Promise((resolve, reject) => {
     exec(cmd, { ...options, timeout: 10000 }, (error, stdout, stderr) => {
      if (error || stderr) {
        error =error || stderr
        console.log("error ",error)
        console.log("stderr: ", stderr)
        //child.kill('SIGTERM');
        reject(stderr || error.message);
      } else {
        console.log("stdout")
        resolve(stdout);
      }
    });
    
  });
};

async function cg() {
  const cgroups = '/sys/fs/cgroup/';
  const enginePath = path.join(cgroups, 'engine');

  try {
    fs.mkdirSync(enginePath, { mode: 0o755 });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }

  // Helper function for writing files
  function must(err) {
    if (err) {
      throw err;
    }
  }

  /* await execShellCommand("sudo touch /sys/fs/cgroup/engine/pids.max")
  await execShellCommand("sudo chmod 666 /sys/fs/cgroup/engine/pids.max") */
  must(fs.writeFileSync(path.join(enginePath, 'pids.max'), '10', { mode: 0o700 }));

}

const createUser = async (username, cpuLimit = '10000', memoryLimit = '500M') => {
  // Create the user
  const createUserCommand = `sudo useradd -m ${username} && echo '${username}:p' | sudo chpasswd`;
  await execShellCommand(createUserCommand);
  //fs.writeFileSync(path.join(enginePath, 'cgroup.procs'), username, { mode: 0o700 })
};

const deleteUser = async (username) => {
  const deleteUserCommand = `sudo userdel -r ${username}`;
  await execShellCommand(deleteUserCommand);

};

const killProcessGroup = async (pgid) => {
  const killCommand = `sudo kill -TERM -${pgid}`;  // Send SIGTERM to process group
  await execShellCommand(killCommand);
};

module.exports = { execShellCommand, createUser, deleteUser, killProcessGroup };
