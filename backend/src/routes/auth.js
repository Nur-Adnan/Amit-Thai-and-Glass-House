import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} from '../controllers/authController.js';
import { protect, ownerOnly } from '../middleware/auth.js';
import validateRequest from '../middleware/validation.js';

const router = express.Router();

// Validation chains. isEmail()/isString() force these fields to be strings,
// which blocks NoSQL operator injection like {"email": {"$gt": ""}}.
const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['owner', 'manager', 'accountant']).withMessage('Invalid role'),
];

// Public routes
router.post('/login', loginValidation, validateRequest, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);

// Owner only routes
router.post('/register', protect, ownerOnly, registerValidation, validateRequest, register);

export default router;