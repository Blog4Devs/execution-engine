const express = require('express');
const path = require('path');
const { execShellCommand, createUser, deleteUser } = require('./utils');
const fs = require('fs');
const app = express();

app.use(express.json());

app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body;
  const execId = `exec_${Date.now()}`;  // Unique user ID

  try {
    // Step 1: Create a new user
    await createUser(execId);

    const userHomeDir = `/home/${execId}`;
    const tempDir = path.join(userHomeDir, 'temp', execId);

    // Create the temporary directory for this execution
    await execShellCommand(`sudo -u ${execId} mkdir -p ${tempDir}`);

    let scriptContent = `
      #!/bin/sh
      ulimit -u 100  
      ulimit -v 500000   # Set virtual memory limit to 500 MB
      ulimit -m 500000   # Set physical memory limit to 500 MB
    `;

    // Step 2: Add commands to the script based on the language
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
        
        await execShellCommand(`echo '${code}' | sudo -u ${execId} tee ${jsFilePath}`);
        scriptContent += `
          node ${jsFilePath}
        `;
        break;
      }

      default:
        throw new Error('Unsupported language');
    }

    // Step 3: Write the script to a file
    const scriptPath = path.join(tempDir, 'execute.sh');
    //fs.writeFileSync(scriptPath, `#!/bin/sh\n${scriptContent}`, { mode: 0o755 });
    await execShellCommand(`echo '${scriptContent}' | sudo -u ${execId} tee ${scriptPath}`);
    //await execShellCommand(`sudo echo -e "${scriptContent}" > ${scriptPath} && sudo chmod 755 ${scriptPath}`)
    await execShellCommand(`sudo -u ${execId} chmod +x ${scriptPath}`)
    // Step 4: Execute the script as the created user
    const output = await execShellCommand(`sudo -u ${execId} sh ${scriptPath}`);

    // Step 5: Return the output to the client
    res.json({ output });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    // Step 6: Cleanup - Delete the user and temporary files
    try {
      await deleteUser(execId);
    } catch (cleanupError) {
      console.error(`Cleanup error: ${cleanupError.message}`);
    }
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
