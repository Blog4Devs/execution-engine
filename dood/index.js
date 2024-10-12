const express = require('express');
const { exec } = require('child_process');
const { execShellCommand } = require('./utils');
const app = express();
app.use(express.json());


// Function to run code in a Docker container based on the language
const runDockerContainer = async (language, code) => {
  let imageName;
  let command;

  switch (language) {
    case 'python':
      imageName = 'python:3.9';
      command = `bash -c "echo '${Buffer.from(code).toString('base64')}' | base64 -d > program.py && python3 program.py"`;

      break;
    case 'cpp':
    imageName = 'gcc:latest';
    command = `bash -c "echo '${Buffer.from(code).toString('base64')}' | base64 -d > program.cpp && g++ -o program program.cpp && ./program"`;

    break;

    case 'java':
    imageName = 'openjdk:17';
    command = `bash -c "echo '${Buffer.from(code).toString('base64')}' | base64 -d > Main.java && javac Main.java && java Main"`;

    
    break;
    
    case 'javascript':
      imageName = 'node:18';
      // Encode the Node.js code to base64
      const base64Code = Buffer.from(code).toString('base64');

      // Construct the command to create a .js file, decode the base64, and run it
      command = `bash -c "echo '${base64Code}' | base64 -d > program.js && node program.js"`;

      break;
    default:
      throw new Error('Unsupported language');
  }

  // Use Docker to run the command
  const containerCommand = `docker run --rm --cpus=1 --pids-limit=100 ${imageName} sh -c 'timeout 10s ${command}'`;

  return await execShellCommand(containerCommand);
};

// API endpoint to execute code
app.post('/api/execute', async (req, res) => {
  const { language, code } = req.body;

  try {
    const output = await runDockerContainer(language, code);
    res.json({ output });
  } catch (error) {
    
    res.status(500).json({ error: error });
  }
});

// Pre-pull Docker images
const prePullDockerImages = async () => {
    const images = [
      'python:3.9',
      'gcc:latest',
      'openjdk:17',
      'node:18',
    ];
  
    for (const image of images) {
      console.log(`Pulling image: ${image}`);
      await execShellCommand(`docker pull ${image}`);
    }
  
    console.log('All images pulled successfully!');
  };
  
  // Start your server
  const startServer = async () => {
    await prePullDockerImages();
    
    // Start the express app
    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  };
  
  // Initialize the application
  startServer();