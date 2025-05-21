const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const userExists = await db.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2', 
        [email, username]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const newUser = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, hashedPassword]
      );

      const token = jwt.sign(
        { userId: newUser.rows[0].id }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
      );

      res.status(201).json({ user: newUser.rows[0], token });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await db.query(
        'SELECT * FROM users WHERE email = $1', 
        [email]
      );

      if (user.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(
        password, 
        user.rows[0].password_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.rows[0].id }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
      );

      res.json({ 
        user: {
          id: user.rows[0].id,
          username: user.rows[0].username,
          email: user.rows[0].email
        },
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await db.query(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [req.userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user.rows[0]);
    } catch (error) {
      console.error("GetMe error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;
