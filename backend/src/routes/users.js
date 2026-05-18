import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser
} from '../controllers/userController.js';
import { protect, ownerOnly, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Manager and above can view users
router.get('/', managerAndAbove, getUsers);
router.get('/:id', managerAndAbove, getUser);

// Owner only routes
router.put('/:id', ownerOnly, updateUser);
router.delete('/:id', ownerOnly, deleteUser);
router.put('/:id/deactivate', ownerOnly, deactivateUser);
router.put('/:id/activate', ownerOnly, activateUser);

export default router;