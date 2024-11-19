const express = require('express');
const axios = require('axios'); // Required for async requests
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Route to get all books
public_users.get('/', function (req, res) {
  return res.status(200).json(JSON.parse(JSON.stringify(books))); // Neatly formatted response
});

// Route to get the list of books available in the shop (using async/await with axios)
public_users.get('/books', async function (req, res) {
  try {
    const response = await axios.get('http://localhost:5000/books');  // Replace with your actual URL
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// Route to get book details based on ISBN (using async/await with axios)
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(`http://localhost:5000/isbn/${isbn}`);  // Replace with your actual URL
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book details by ISBN', error: error.message });
  }
});

// Route to get book details based on author (using async/await with axios)
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;

  try {
    const response = await axios.get(`http://localhost:5000/author/${author}`);  // Replace with your actual URL
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books by author', error: error.message });
  }
});

// Route to get all books based on title (using async/await with axios)
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;

  try {
    const response = await axios.get(`http://localhost:5000/title/${title}`);  // Replace with your actual URL
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books by title', error: error.message });
  }
});

// Route to get book review (using async/await with axios)
public_users.get('/review/:isbn', async function (req, res) {
  const isbn = req.params.isbn;

  try {
    const response = await axios.get(`http://localhost:5000/review/${isbn}`);  // Replace with your actual URL
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews for this book', error: error.message });
  }
});

// Route to register a new user
public_users.post('/register', function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (users[username]) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  users[username] = { username, password };
  return res.status(200).json({ message: 'User registered successfully' });
});

// Route to log in as a registered user and return JWT
const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key'; // Replace with a stronger key
public_users.post('/customer/login', function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!users[username] || users[username].password !== password) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
  return res.status(200).json({ message: 'Login successful', token });
});

// Route to add or modify a book review (using session stored username)
public_users.post('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const { review } = req.body;
  const { username } = req.session;

  if (!username || !review) {
    return res.status(400).json({ message: 'Review text is required and you must be logged in' });
  }

  let book = books.find(b => b.isbn === isbn);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const existingReview = book.reviews.find(r => r.username === username);
  if (existingReview) {
    existingReview.review = review;  // Modify the review
    return res.status(200).json({ message: 'Review updated successfully' });
  }

  book.reviews.push({ username, review });  // Add new review
  return res.status(200).json({ message: 'Review added successfully' });
});

// Route to delete a book review (only if the user posted it)
public_users.delete('/auth/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const { username } = req.session;

  if (!username) {
    return res.status(400).json({ message: 'You must be logged in to delete a review' });
  }

  let book = books.find(b => b.isbn === isbn);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const reviewIndex = book.reviews.findIndex(r => r.username === username);
  if (reviewIndex === -1) {
    return res.status(400).json({ message: 'Review not found' });
  }

  book.reviews.splice(reviewIndex, 1);
  return res.status(200).json({ message: 'Review deleted successfully' });
});

module.exports.general = public_users;
