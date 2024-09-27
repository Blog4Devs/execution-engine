const express = require('express');
const path = require('path');
const { execShellCommand, createUser, deleteUser, killProcessGroup } = require('./utils');
const app = express();

app.use(express.json());

app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body;
  const execId = `exec_${Date.now()}`;  // Unique user ID

  let pgid;  // Process group ID to track

  try {
    // Step 1: Create a new user
    await createUser(execId);
    const userHomeDir = `/home/${execId}`;
    const tempDir = path.join(userHomeDir, 'temp', execId);

    // Create the temporary directory for this execution
    await execShellCommand(`sudo -u ${execId} mkdir -p ${tempDir}`);

    // Prepare the shell script content
    let scriptContent = `
      #!/bin/sh
      ulimit -u 100   # Limit number of processes to 100
      ulimit -v 500000   # Set virtual memory limit to 500 MB
      ulimit -m 500000   # Set physical memory limit to 500 MB
      setsid  # Create new process group
    `;

    // Add language-specific execution logic
    switch (language) {
      case 'java': {
        const className = 'Main';
        const javaFilePath = path.join(tempDir, `${className}.java`);

        // Java commands: Write code, compile, and run
        scriptContent += `
          echo '${code}' > ${javaFilePath}
          javac ${javaFilePath}
          java -cp ${tempDir} ${className}
        `;
        break;
      }

      case 'cpp': {
        const cppFilePath = path.join(tempDir, 'program.cpp');
        const executableFile = path.join(tempDir, 'program');

        // C++ commands: Write code, compile, and run
        scriptContent += `
          echo '${code}' > ${cppFilePath}
          g++ -o ${executableFile} ${cppFilePath}
          ${executableFile}
        `;
        break;
      }

      case 'javascript': {
        const jsFilePath = path.join(tempDir, 'script.js');

        // JavaScript commands: Write code and run
        scriptContent += `
          echo '${code}' > ${jsFilePath}
          node ${jsFilePath}
        `;
        break;
      }

      default:
        throw new Error('Unsupported language');
    }

    // Write the script to a file
    const scriptPath = path.join(tempDir, 'execute.sh');
    await execShellCommand(`echo '${scriptContent}' | sudo -u ${execId} tee ${scriptPath}`);
    await execShellCommand(`sudo -u ${execId} chmod +x ${scriptPath}`);

    // Step 2: Execute the script in a new process group and get its PGID
    const pgidCommand = `sudo -u ${execId} setsid sh -c 'echo $$ > ${tempDir}/pgid && exec sh ${scriptPath}'`;
    await execShellCommand(pgidCommand);

    // Step 3: Retrieve the process group ID (PGID)
    pgid = await execShellCommand(`cat ${tempDir}/pgid`);

    // Step 4: Capture the output of the script
    const output = await execShellCommand(`sudo -u ${execId} sh ${scriptPath}`);

    // Return the output to the client
    res.json({ output });

  } catch (error) {
    console.error(error);

    // If error occurs, terminate the process group
    if (pgid) {
      await killProcessGroup(pgid);
    }

    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup - Delete the user and its files
    try {
      await deleteUser(execId);
    } catch (cleanupError) {
      console.error(`Cleanup error: ${cleanupError.message}`);
    }
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));

// Utility functions
const { exec } = require('child_process');

// Executes shell commands asynchronously
const execShellCommand = (cmd, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { ...options, timeout: 10000 }, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Error: ", error || stderr);
        reject(stderr || error.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

// Creates a user with process and memory limits
const createUser = async (username) => {
  const createUserCommand = `sudo useradd -m ${username} && echo '${username}:password' | sudo chpasswd`;
  await execShellCommand(createUserCommand);
};

// Deletes a user and its home directory
const deleteUser = async (username) => {
  const deleteUserCommand = `sudo userdel -r ${username}`;
  await execShellCommand(deleteUserCommand);
};

// Kill all processes in a process group
const killProcessGroup = async (pgid) => {
  const killCommand = `sudo kill -TERM -${pgid}`;  // Send SIGTERM to process group
  await execShellCommand(killCommand);
};

module.exports = { execShellCommand, createUser, deleteUser, killProcessGroup };
