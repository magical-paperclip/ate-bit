const express = require('express');
const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static('./'));

// Start the server
app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
}); 