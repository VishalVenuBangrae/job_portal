import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Location from './models/Location.js';

dotenv.config();

const popularLocations = [
  // Mediterranean
  { country: 'Monaco', city: 'Monte Carlo', port: 'Port Hercule', region: 'Mediterranean' },
  { country: 'France', city: 'Antibes', port: 'Port Vauban', region: 'Mediterranean' },
  { country: 'France', city: 'Cannes', port: 'Port de Cannes', region: 'Mediterranean' },
  { country: 'France', city: 'Nice', port: 'Port de Nice', region: 'Mediterranean' },
  { country: 'France', city: 'Marseille', port: 'Port de Marseille', region: 'Mediterranean' },
  { country: 'Italy', city: 'Genoa', port: 'Porto di Genova', region: 'Mediterranean' },
  { country: 'Italy', city: 'Naples', port: 'Porto di Napoli', region: 'Mediterranean' },
  { country: 'Italy', city: 'Portofino', port: 'Porto di Portofino', region: 'Mediterranean' },
  { country: 'Italy', city: 'Capri', port: 'Porto di Capri', region: 'Mediterranean' },
  { country: 'Italy', city: 'Sardinia', port: 'Porto di Olbia', region: 'Mediterranean' },
  { country: 'Spain', city: 'Barcelona', port: 'Port Vell', region: 'Mediterranean' },
  { country: 'Spain', city: 'Palma de Mallorca', port: 'Puerto de Palma', region: 'Mediterranean' },
  { country: 'Spain', city: 'Ibiza', port: 'Puerto de Ibiza', region: 'Mediterranean' },
  { country: 'Greece', city: 'Athens', port: 'Piraeus Port', region: 'Mediterranean' },
  { country: 'Greece', city: 'Mykonos', port: 'Port of Mykonos', region: 'Mediterranean' },
  { country: 'Greece', city: 'Santorini', port: 'Port of Santorini', region: 'Mediterranean' },
  { country: 'Croatia', city: 'Split', port: 'Port of Split', region: 'Mediterranean' },
  { country: 'Croatia', city: 'Dubrovnik', port: 'Port of Dubrovnik', region: 'Mediterranean' },
  { country: 'Turkey', city: 'Istanbul', port: 'Port of Istanbul', region: 'Mediterranean' },
  { country: 'Turkey', city: 'Antalya', port: 'Port of Antalya', region: 'Mediterranean' },
  { country: 'Malta', city: 'Valletta', port: 'Grand Harbour', region: 'Mediterranean' },

  // Caribbean
  { country: 'Bahamas', city: 'Nassau', port: 'Nassau Harbor', region: 'Caribbean' },
  { country: 'Bahamas', city: 'Freeport', port: 'Port Lucaya', region: 'Caribbean' },
  { country: 'British Virgin Islands', city: 'Road Town', port: 'Road Town Harbor', region: 'Caribbean' },
  { country: 'British Virgin Islands', city: 'Tortola', port: 'Port of Tortola', region: 'Caribbean' },
  { country: 'Antigua and Barbuda', city: 'St. John\'s', port: 'St. John\'s Harbor', region: 'Caribbean' },
  { country: 'St. Martin', city: 'Marigot', port: 'Port de Marigot', region: 'Caribbean' },
  { country: 'St. Barts', city: 'Gustavia', port: 'Port de Gustavia', region: 'Caribbean' },
  { country: 'St. Kitts and Nevis', city: 'Basseterre', port: 'Port Zante', region: 'Caribbean' },
  { country: 'St. Lucia', city: 'Castries', port: 'Port of Castries', region: 'Caribbean' },
  { country: 'Barbados', city: 'Bridgetown', port: 'Port of Bridgetown', region: 'Caribbean' },
  { country: 'Grenada', city: 'St. George\'s', port: 'Port of St. George\'s', region: 'Caribbean' },
  { country: 'Dominica', city: 'Roseau', port: 'Port of Roseau', region: 'Caribbean' },

  // Indian Ocean
  { country: 'Seychelles', city: 'Victoria', port: 'Port Victoria', region: 'Indian Ocean' },
  { country: 'Maldives', city: 'Male', port: 'Port of Male', region: 'Indian Ocean' },
  { country: 'Mauritius', city: 'Port Louis', port: 'Port of Port Louis', region: 'Indian Ocean' },
  { country: 'Madagascar', city: 'Nosy Be', port: 'Port of Nosy Be', region: 'Indian Ocean' },

  // Asia Pacific
  { country: 'Thailand', city: 'Phuket', port: 'Port of Phuket', region: 'Asia Pacific' },
  { country: 'Thailand', city: 'Koh Samui', port: 'Port of Koh Samui', region: 'Asia Pacific' },
  { country: 'Singapore', city: 'Singapore', port: 'Marina Bay', region: 'Asia Pacific' },
  { country: 'Malaysia', city: 'Langkawi', port: 'Port of Langkawi', region: 'Asia Pacific' },
  { country: 'Indonesia', city: 'Bali', port: 'Port of Benoa', region: 'Asia Pacific' },
  { country: 'Philippines', city: 'Manila', port: 'Port of Manila', region: 'Asia Pacific' },
  { country: 'Vietnam', city: 'Ho Chi Minh City', port: 'Port of Ho Chi Minh', region: 'Asia Pacific' },

  // Australia & New Zealand
  { country: 'Australia', city: 'Sydney', port: 'Sydney Harbor', region: 'Australia & New Zealand' },
  { country: 'Australia', city: 'Gold Coast', port: 'Marina Mirage', region: 'Australia & New Zealand' },
  { country: 'Australia', city: 'Perth', port: 'Fremantle Port', region: 'Australia & New Zealand' },
  { country: 'New Zealand', city: 'Auckland', port: 'Ports of Auckland', region: 'Australia & New Zealand' },
  { country: 'New Zealand', city: 'Wellington', port: 'Port of Wellington', region: 'Australia & New Zealand' },

  // North America
  { country: 'United States', city: 'Miami', port: 'PortMiami', region: 'North America' },
  { country: 'United States', city: 'Fort Lauderdale', port: 'Port Everglades', region: 'North America' },
  { country: 'United States', city: 'Newport', port: 'Newport Harbor', region: 'North America' },
  { country: 'United States', city: 'San Diego', port: 'Port of San Diego', region: 'North America' },
  { country: 'United States', city: 'San Francisco', port: 'Port of San Francisco', region: 'North America' },
  { country: 'United States', city: 'Seattle', port: 'Port of Seattle', region: 'North America' },
  { country: 'Canada', city: 'Vancouver', port: 'Port of Vancouver', region: 'North America' },
  { country: 'Canada', city: 'Toronto', port: 'Port of Toronto', region: 'North America' },

  // Europe
  { country: 'United Kingdom', city: 'London', port: 'Port of London', region: 'Europe' },
  { country: 'United Kingdom', city: 'Southampton', port: 'Port of Southampton', region: 'Europe' },
  { country: 'Netherlands', city: 'Amsterdam', port: 'Port of Amsterdam', region: 'Europe' },
  { country: 'Germany', city: 'Hamburg', port: 'Port of Hamburg', region: 'Europe' },
  { country: 'Norway', city: 'Oslo', port: 'Port of Oslo', region: 'Europe' },
  { country: 'Sweden', city: 'Stockholm', port: 'Port of Stockholm', region: 'Europe' },
  { country: 'Denmark', city: 'Copenhagen', port: 'Port of Copenhagen', region: 'Europe' },

  // Middle East
  { country: 'United Arab Emirates', city: 'Dubai', port: 'Port Rashid', region: 'Middle East' },
  { country: 'United Arab Emirates', city: 'Abu Dhabi', port: 'Port of Abu Dhabi', region: 'Middle East' },
  { country: 'Qatar', city: 'Doha', port: 'Port of Doha', region: 'Middle East' },
  { country: 'Oman', city: 'Muscat', port: 'Port Sultan Qaboos', region: 'Middle East' },

  // South America
  { country: 'Brazil', city: 'Rio de Janeiro', port: 'Port of Rio de Janeiro', region: 'South America' },
  { country: 'Brazil', city: 'São Paulo', port: 'Port of Santos', region: 'South America' },
  { country: 'Argentina', city: 'Buenos Aires', port: 'Port of Buenos Aires', region: 'South America' },
  { country: 'Chile', city: 'Valparaíso', port: 'Port of Valparaíso', region: 'South America' },
  { country: 'Peru', city: 'Lima', port: 'Port of Callao', region: 'South America' }
];

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/job_portal';
    console.log(`Connecting to MongoDB: ${mongoUrl}`);
    const conn = await mongoose.connect(mongoUrl);
    console.log(`Connected to MongoDB Database ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`MongoDB error ${error}`);
    process.exit(1);
  }
};

const setupLocations = async () => {
  try {
    await connectDB();
    
    console.log('Setting up locations...');
    
    // Clear existing locations
    await Location.deleteMany({});
    console.log('Cleared existing locations');
    
    // Insert new locations
    const locationDocs = popularLocations.map(location => new Location(location));
    await Location.insertMany(locationDocs);
    
    console.log(`✅ Successfully added ${popularLocations.length} locations to the database`);
    
    // Display some statistics
    const countries = await Location.distinct('country');
    const cities = await Location.distinct('city');
    const regions = await Location.distinct('region');
    
    console.log(`\n📊 Location Statistics:`);
    console.log(`Countries: ${countries.length}`);
    console.log(`Cities: ${cities.length}`);
    console.log(`Regions: ${regions.length}`);
    
    console.log('\n🌍 Regions:');
    regions.forEach(region => {
      const count = popularLocations.filter(loc => loc.region === region).length;
      console.log(`  ${region}: ${count} locations`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up locations:', error);
    process.exit(1);
  }
};

setupLocations();
