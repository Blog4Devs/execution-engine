const express = require('express');
const path = require('path');
const { execShellCommand, createUser, deleteUser, cg } = require('./utils');
const fs = require('fs');
const app = express();

app.use(express.json());

app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body;
  
  const execId = `exec_${Date.now()}`;
  
  try {
    await createUser(execId);

    const userHomeDir = `/home/${execId}`;
    const tempDir = path.join(userHomeDir, 'temp', execId);

    await execShellCommand(`sudo -u ${execId} mkdir -p ${tempDir}`);

    await execShellCommand(`/usr/src/app/bash.sh && ls`);

    let output = '';
console.log("after bash")
    switch (language) {
      case 'java': {
        const className = 'Main';
        const javaFilePath = path.join(tempDir, `${className}.java`);
        await execShellCommand(`echo '${code}' | sudo -u ${execId} tee ${javaFilePath}`);

        await execShellCommand(`sudo -u ${execId} javac ${className}.java`, { cwd: tempDir });

        output = await execShellCommand(`sudo -u ${execId} java ${className}`, { cwd: tempDir });
        break;
      }

      case 'cpp': {
        const cppFilePath = path.join(tempDir, 'program.cpp');
        const executableFile = path.join(tempDir, 'program');
        await execShellCommand(`echo '${code}' | sudo -u ${execId} tee ${cppFilePath}`);

        await execShellCommand(`sudo -u ${execId} g++ -o ${executableFile} program.cpp`, { cwd: tempDir });

        output = await execShellCommand(`sudo -u ${execId} ./program`, { cwd: tempDir });
        break;
      }

      case 'javascript': {
        const jsFilePath = path.join(tempDir, 'script.js');
        await execShellCommand(`echo '${code}' | sudo -u ${execId} tee ${jsFilePath}`);

        output = await execShellCommand(`sudo -u ${execId} node script.js`, { cwd: tempDir });
        break;
      }

      default:
        throw new Error('Unsupported language');
    }
    res.json({ output });

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error });
  } finally {
    try {
      await deleteUser(execId);
    } catch (cleanupError) {
      console.error(`Cleanup error: ${cleanupError.message}`);
    }
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
