const express = require('express');
const { exec } = require('child_process');
const app = express();
app.use(express.json());

app.post('/api/execute', (req, res) => {
    const { language, code } = req.body;

    let command;

    if (language === 'python3') {
        command = `echo '${code}' | docker run --rm -i python:3.9 python3 -`;
    } else if (language === 'cpp') {
        command = `echo '${code}' | docker run --rm -i gcc:latest sh -c 'g++ -o /dev/stdout - && /dev/stdout'`;
    } else if (language === 'java') {
        command = `echo '${code}' | docker run --rm -i openjdk:17 sh -c 'javac -d . - && java .'`;
    } else {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ output: stdout });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
