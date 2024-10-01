const express = require('express');
const { exec } = require('child_process');
const app = express();
app.use(express.json());

// Function to execute shell commands
const execShellCommand = async (cmd) => {
    return new Promise((resolve, reject) => {
      console.log(`Executing command: ${cmd}`);  // Log the command
      exec(cmd, { timeout: 100000 }, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error("Error: ", stderr || error.message);
          reject(stderr || error.message);
        } else {
          console.log(`Command output: ${stdout}`);  // Log the output
          resolve(stdout);
        }
      });
    });
  };

// Function to run code in a Docker container based on the language
const runDockerContainer = async (language, code) => {
  let imageName;
  let command;

  switch (language) {
    case 'python':
      imageName = 'python:3.9';
      //command = `python3 -c "${code.replace(/"/g, '\\"')}"`;;

      command = `bash -c "echo '${Buffer.from(code).toString('base64')}' | base64 -d > program.py && python3 program.py"`;

      break;
    case 'cpp':
    imageName = 'gcc:latest';
    // Use echo -e to handle newlines, escape single quotes, and compile the program
    //command = `bash -c "echo -e '${code.replace(/'/g, "'\\''")}' > program.cpp && g++ -o program program.cpp && ./program"`;

    // Construct the command using base64 encoding
    command = `bash -c "echo '${Buffer.from(code).toString('base64')}' | base64 -d > program.cpp && g++ -o program program.cpp && ./program"`;

    break;

    case 'java':
    imageName = 'openjdk:17';
    // Use echo -e to handle newlines and escape single quotes for the Java code
    //command = `bash -c "echo -e '${code.replace(/'/g, "'\\''")}' > Main.java && javac Main.java && java Main"`;
    command = `bash -c "echo '${Buffer.from(code).toString('base64')}' | base64 -d > Main.java && javac Main.java && java Main"`;

    
    break;
    
    case 'javascript':
      imageName = 'node:18';
      //command = `node -e "${code.replace(/"/g, '\\"')}"`;
      // Encode the Node.js code to base64
      const base64Code = Buffer.from(code).toString('base64');

      // Construct the command to create a .js file, decode the base64, and run it
      command = `bash -c "echo '${base64Code}' | base64 -d > program.js && node program.js"`;

      break;
    default:
      throw new Error('Unsupported language');
  }

  // Use Docker to run the command
  const containerCommand = `docker run --rm ${imageName} sh -c '${command}'`;
  //const containerCommand = `docker -H unix:///var/run/docker.sock run --rm ${imageName} sh -c '${command}'`;

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