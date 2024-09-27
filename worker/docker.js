const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Function to run code inside a new Docker container
async function runInDockerContainer(language, code) {
  const containerId = `container_${Date.now()}`;
  const tempDir = `/tmp/${containerId}`; // Create a unique temp directory for each user

  // Create the temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  // Write the user's code to a file in the temp directory
  let filePath;
  let command;
  switch (language) {
    case 'java': {
      filePath = path.join(tempDir, 'Main.java');
      fs.writeFileSync(filePath, code);
      command = `docker run --rm --name ${containerId} -v ${tempDir}:/usr/src/app -w /usr/src/app openjdk:17-alpine javac Main.java && java Main`;
      break;
    }

    case 'cpp': {
      filePath = path.join(tempDir, 'program.cpp');
      fs.writeFileSync(filePath, code);
      command = `docker run --rm --name ${containerId} -v ${tempDir}:/usr/src/app -w /usr/src/app gcc:latest g++ -o program program.cpp && ./program`;
      break;
    }

    case 'javascript': {
      filePath = path.join(tempDir, 'script.js');
      fs.writeFileSync(filePath, code);
      command = `docker run --rm --name ${containerId} -v ${tempDir}:/usr/src/app -w /usr/src/app node:18-alpine node script.js`;
      break;
    }

    default:
      throw new Error('Unsupported language');
  }

  // Execute the Docker command
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      // Clean up the temp directory
      fs.rmdirSync(tempDir, { recursive: true });
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Route to handle code execution requests
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body;

  try {
    const output = await runInDockerContainer(language, code);
    res.json({ output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
