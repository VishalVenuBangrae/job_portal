import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  port: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create a compound index for efficient location queries
locationSchema.index({ country: 1, city: 1, port: 1 });

// Virtual for full location display
locationSchema.virtual('fullLocation').get(function() {
  let location = this.city;
  if (this.port) {
    location += `, ${this.port}`;
  }
  location += `, ${this.country}`;
  return location;
});

// Ensure virtuals are serialized
locationSchema.set('toJSON', { virtuals: true });

const Location = mongoose.model('Location', locationSchema);

export default Location;
