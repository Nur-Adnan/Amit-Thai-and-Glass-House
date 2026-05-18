import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: [true, 'Permission description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Permission category is required'],
    enum: {
      values: ['invoice', 'product', 'financial', 'employee', 'system'],
      message: 'Category must be invoice, product, financial, employee, or system'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
permissionSchema.index({ name: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ isActive: 1 });

export default mongoose.model('Permission', permissionSchema);