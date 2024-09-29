const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
class Semaphore {
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return Promise.resolve();
    }

    return new Promise((resolve) => this.queue.push(resolve));
  }

  release() {
    this.count--;
    if (this.queue.length > 0) {
      this.count++;
      const next = this.queue.shift();
      next();
    }
  }
}

const userCreationSemaphore = new Semaphore(1);

const execShellCommand = (cmd, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { ...options, timeout: 10000 }, (error, stdout, stderr) => {
      if (error || stderr) {
        console.log("error ", error);
        console.log("stderr: ", stderr);
        reject(stderr || error.message);
      } else {
        console.log("stdout");
        resolve(stdout);
      }
    });
  });
};

// async function cg() {
//   const cgroups = '/sys/fs/cgroup/';
//   const enginePath = path.join(cgroups, 'engine');

//   try {
//     fs.mkdirSync(enginePath, { mode: 0o755 });
//   } catch (err) {
//     if (err.code !== 'EEXIST') {
//       throw err;
//     }
//   }

//   // Helper function for writing files
//   function must(err) {
//     if (err) {
//       console.error(err)
//     }
//   }

//   /* await execShellCommand("sudo touch /sys/fs/cgroup/engine/pids.max")
//   await execShellCommand("sudo chmod 666 /sys/fs/cgroup/engine/pids.max") */
//   must(fs.writeFileSync(path.join(enginePath, 'pids.max'), '10', { mode: 0o700 }));

// }

// Main function to create and configure cgroups
async function cg() {
  const cgroups = "/sys/fs/cgroup/pids";
  const enginePath = path.join(cgroups, "engine");

  try {
    // Create the directory for cgroups (with sudo)
    await execShellCommand(`sudo mkdir -p ${enginePath}`);
    await execShellCommand(`sudo chmod 755 ${enginePath}`);
  } catch (err) {
    console.error("Error creating or setting up the engine path:", err);
  }

  // Write to the cgroups file using sudo
  try {
    await execShellCommand(
      `echo '40' | sudo tee ${path.join(enginePath, "pids.max")}`
    );
    await execShellCommand(
      `sudo chmod 666 ${path.join(enginePath, "pids.max")}`
    );
    await execShellCommand(
      `sudo chmod 666 ${path.join(enginePath, "cgroup.procs")}`
    );
  } catch (err) {
    console.error("Error writing to pids.max:", err);
  }
}
const createUser = async (
  username,
  cpuLimit = "10000",
  memoryLimit = "500M"
) => {
  await userCreationSemaphore.acquire();
  try {
    const createUserCommand = `sudo useradd -m ${username} && echo '${username}:p' | sudo chpasswd`;
    await execShellCommand(createUserCommand);
    console.log(`User ${username} created successfully.`);

    // // Get the user's shell process ID (PID)
    // const pidCommand = `pgrep -u ${username} -n`; // Get the newest PID for the user
    // const userPid = await execShellCommand(pidCommand);

    // // Assign the user's process to the 'engine' cgroup
    // const cgroupTasksFile = `/sys/fs/cgroup/pids/engine/cgroups.procs`;
    // await execShellCommand(
    //   `echo ${userPid.trim()} | sudo tee -a ${cgroupTasksFile}`
    // );

    // console.log(
    //   `User ${username} (PID: ${userPid.trim()}) added to cgroup 'engine'.`
    // );
  } catch (error) {
    console.error(`Error creating user ${username}:`, error.message);
    throw error;
  } finally {
    userCreationSemaphore.release();
  }
};

const deleteUser = async (username) => {
  await userCreationSemaphore.acquire();
  try {
    const deleteUserCommand = `sudo userdel -r ${username}`;
    await execShellCommand(deleteUserCommand);
    console.log(`User ${username} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting user ${username}:`, error.message);
    throw error;
  } finally {
    userCreationSemaphore.release();
  }
};

const killProcessGroup = async (pgid) => {
  const killCommand = `sudo kill -TERM -${pgid}`; // Send SIGTERM to process group
  await execShellCommand(killCommand);
};

module.exports = {
  execShellCommand,
  createUser,
  deleteUser,
  killProcessGroup,
  cg,
};
