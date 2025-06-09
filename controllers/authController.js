const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      console.log('Received data:', { username, email, password: password ? '[HIDDEN]' : undefined });
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields (username, email, password) are required' });
      }

      // Test database connection
      console.log('Testing database connection...');
      
      // Check if user already exists
      const userExists = await db.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'User with email or username already exists' });
      }

      // Hash password
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert new user
      console.log('Inserting new user...');
      const newUser = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
      );

      // Create JWT token
      console.log('Creating JWT token...');
      const token = jwt.sign(
        { userId: newUser.rows[0].id },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({ user: newUser.rows[0], token });
    } catch (error) {
      console.error('Register Error Details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      
      // More specific error handling
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'User already exists' });
      }
      if (error.code === 'ECONNREFUSED') {
        return res.status(500).json({ error: 'Database connection failed' });
      }
      
      res.status(500).json({ error: 'Server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for email:', email);
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      console.log('Searching for user...');
      const user = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (user.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare password
      console.log('Comparing password...');
      const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      console.log('Generating token...');
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
      console.error('Login Error Details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ error: 'Server error' });
    }
  },

  getMe: async (req, res) => {
    try {
      console.log('Getting user info for ID:', req.userId);
      
      if (!req.userId) {
        return res.status(401).json({ error: 'No user ID in request' });
      }
      
      const user = await db.query(
        'SELECT id, username, email FROM users WHERE id = $1',
        [req.userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user.rows[0]);
    } catch (error) {
      console.error('GetMe Error Details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ error: 'Server error' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      console.log('Change password attempt for user ID:', req.userId);
      
      // Validate required fields
      if (!current_password || !new_password) {
        return res.status(400).json({ 
          error: 'Current password and new password are required',
          success: false 
        });
      }

      // Validate new password length
      if (new_password.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long',
          success: false 
        });
      }

      // Get current user data
      console.log('Fetching user data...');
      const user = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [req.userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ 
          error: 'User not found',
          success: false 
        });
      }

      // Verify current password
      console.log('Verifying current password...');
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.rows[0].password_hash);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          error: 'Current password is incorrect',
          success: false 
        });
      }

      // Hash new password
      console.log('Hashing new password...');
      const hashedNewPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

      // Update password in database
      console.log('Updating password in database...');
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedNewPassword, req.userId]
      );

      res.json({ 
        message: 'Password changed successfully',
        success: true 
      });

    } catch (error) {
      console.error('Change Password Error Details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ 
        error: 'Server error while changing password',
        success: false 
      });
    }
  }
};

module.exports = authController;
