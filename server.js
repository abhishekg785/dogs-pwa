const path = require('path');
const express = require('express');

const app = express();

// serve static files in public
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.listen(9500, () => {
    console.log('listening on port 9500');
});
