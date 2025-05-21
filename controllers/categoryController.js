const db = require('../db');

const categoryController = {
  getCategories: async (req, res) => {
    try {
      console.log('Getting categories for user:', req.userId); // Debug log
      
      const categories = await db.query(
        'SELECT * FROM categories WHERE user_id = $1 ORDER BY name',
        [req.userId]
      );
      
      console.log('Found categories:', categories.rows.length); // Debug log
      res.json(categories.rows);
    } catch (error) {
      console.error('Get categories error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  createCategory: async (req, res) => {
    try {
      console.log('Creating category for user:', req.userId); // Debug log
      console.log('Request body:', req.body); // Debug log
      
      const { name, color, icon } = req.body;
      
      // Validate required fields
      if (!name || !color) {
        return res.status(400).json({ error: 'Name and color are required' });
      }
      
      // Validate user ID
      if (!req.userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }
      
      const newCategory = await db.query(
        'INSERT INTO categories (user_id, name, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.userId, name, color, icon]
      );
      
      console.log('Created category:', newCategory.rows[0]); // Debug log
      res.status(201).json(newCategory.rows[0]);
    } catch (error) {
      console.error('Create category error:', error.message);
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, color, icon } = req.body;
      
      console.log('Updating category:', id, 'for user:', req.userId); // Debug log
      
      // Validate required fields
      if (!name || !color) {
        return res.status(400).json({ error: 'Name and color are required' });
      }
      
      const updatedCategory = await db.query(
        'UPDATE categories SET name = $1, color = $2, icon = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
        [name, color, icon, id, req.userId]
      );
      
      if (updatedCategory.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found or you do not have permission to update it' });
      }
      
      res.json(updatedCategory.rows[0]);
    } catch (error) {
      console.error('Update category error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('Deleting category:', id, 'for user:', req.userId); // Debug log
      
      // First, set category_id to NULL for expenses with this category
      await db.query(
        'UPDATE expenses SET category_id = NULL WHERE category_id = $1 AND user_id = $2',
        [id, req.userId]
      );
      
      // Then delete the category
      const deletedCategory = await db.query(
        'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.userId]
      );
      
      if (deletedCategory.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found or you do not have permission to delete it' });
      }
      
      console.log('Deleted category:', deletedCategory.rows[0]); // Debug log
      res.json({ message: 'Category deleted successfully', category: deletedCategory.rows[0] });
    } catch (error) {
      console.error('Delete category error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = categoryController;
