
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(express.static('public')); 
app.use('/uploads', express.static('uploads')); 

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'music_player'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});


const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).single('song');


app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed', error: err });
    }

    const { title, artist, album, lyrics } = req.body; // Make sure to get lyrics
    const file_path = req.file.path;

    const sql = "INSERT INTO songs (title, artist, album, lyrics, file_path) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [title, artist, album, lyrics, file_path], (err, result) => {
      if (err) throw err;
      res.status(200).json({ message: 'Song uploaded successfully', songId: result.insertId });
    });
  });
});

app.get('/songs', (req, res) => {
  const sql = "SELECT * FROM songs";
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


app.get('/songs/:id', (req, res) => {
  const sql = "SELECT * FROM songs WHERE id = ?";
  db.query(sql, [req.params.id], (err, results) => {
    if (err) throw err;
    const song = results[0];
    res.json(song);
  });
});


app.get('/play/:id', (req, res) => {
  const sql = "SELECT file_path FROM songs WHERE id = ?";
  db.query(sql, [req.params.id], (err, results) => {
    if (err) throw err;
    const song = results[0];
    res.sendFile(path.join(__dirname, song.file_path));
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
