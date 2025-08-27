// Comprehensive yacht port sync script
// Syncs yacht port data from comprehensive database to local database

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Location from './models/Location.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Connected to MongoDB Database ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`MongoDB error ${error}`);
    process.exit(1);
  }
};

// Helper function to determine region from country
const getRegionFromCountry = (country) => {
  const regionMap = {
    // Mediterranean
    'Monaco': 'Mediterranean', 'France': 'Mediterranean', 'Italy': 'Mediterranean',
    'Spain': 'Mediterranean', 'Greece': 'Mediterranean', 'Croatia': 'Mediterranean',
    'Turkey': 'Mediterranean', 'Malta': 'Mediterranean',
    
    // Caribbean
    'Bahamas': 'Caribbean', 'British Virgin Islands': 'Caribbean',
    'Antigua and Barbuda': 'Caribbean', 'St. Martin': 'Caribbean',
    'St. Barts': 'Caribbean', 'St. Kitts and Nevis': 'Caribbean',
    'St. Lucia': 'Caribbean', 'Barbados': 'Caribbean',
    'Grenada': 'Caribbean', 'Dominica': 'Caribbean',
    
    // Indian Ocean
    'Seychelles': 'Indian Ocean', 'Maldives': 'Indian Ocean',
    'Mauritius': 'Indian Ocean', 'Madagascar': 'Indian Ocean',
    
    // Asia Pacific
    'Thailand': 'Asia Pacific', 'Singapore': 'Asia Pacific',
    'Malaysia': 'Asia Pacific', 'Indonesia': 'Asia Pacific',
    'Philippines': 'Asia Pacific', 'Vietnam': 'Asia Pacific',
    
    // Australia & New Zealand
    'Australia': 'Australia & New Zealand', 'New Zealand': 'Australia & New Zealand',
    
    // North America
    'United States': 'North America', 'Canada': 'North America',
    
    // Europe
    'United Kingdom': 'Europe', 'Netherlands': 'Europe',
    'Germany': 'Europe', 'Norway': 'Europe',
    'Sweden': 'Europe', 'Denmark': 'Europe',
    
    // Middle East
    'United Arab Emirates': 'Middle East', 'Qatar': 'Middle East',
    'Oman': 'Middle East',
    
    // South America
    'Brazil': 'South America', 'Argentina': 'South America',
    'Chile': 'South America', 'Peru': 'South America'
  };
  
  return regionMap[country] || 'Other';
};

// Comprehensive yacht port database
const COMPREHENSIVE_YACHT_PORTS = [
  // Mediterranean - France
  { name: 'Port Vauban', country: 'France', city: 'Antibes', coordinates: { latitude: 43.5808, longitude: 7.1231 }, type: 'Marina' },
  { name: 'Port Galice', country: 'France', city: 'Antibes', coordinates: { latitude: 43.5808, longitude: 7.1231 }, type: 'Marina' },
  { name: 'Port de la Salis', country: 'France', city: 'Antibes', coordinates: { latitude: 43.5808, longitude: 7.1231 }, type: 'Marina' },
  { name: 'Port de Cannes', country: 'France', city: 'Cannes', coordinates: { latitude: 43.5528, longitude: 7.0174 }, type: 'Marina' },
  { name: 'Port Canto', country: 'France', city: 'Cannes', coordinates: { latitude: 43.5528, longitude: 7.0174 }, type: 'Marina' },
  { name: 'Port Pierre Canto', country: 'France', city: 'Cannes', coordinates: { latitude: 43.5528, longitude: 7.0174 }, type: 'Marina' },
  { name: 'Port de Nice', country: 'France', city: 'Nice', coordinates: { latitude: 43.6951, longitude: 7.2716 }, type: 'Marina' },
  { name: 'Port Lympia', country: 'France', city: 'Nice', coordinates: { latitude: 43.6951, longitude: 7.2716 }, type: 'Marina' },
  { name: 'Port de la Darse', country: 'France', city: 'Nice', coordinates: { latitude: 43.6951, longitude: 7.2716 }, type: 'Marina' },
  { name: 'Port de Marseille', country: 'France', city: 'Marseille', coordinates: { latitude: 43.2965, longitude: 5.3698 }, type: 'Marina' },
  { name: 'Vieux Port', country: 'France', city: 'Marseille', coordinates: { latitude: 43.2965, longitude: 5.3698 }, type: 'Marina' },
  { name: 'Port de la Pointe Rouge', country: 'France', city: 'Marseille', coordinates: { latitude: 43.2965, longitude: 5.3698 }, type: 'Marina' },
  { name: 'Port de Saint-Tropez', country: 'France', city: 'Saint-Tropez', coordinates: { latitude: 43.2694, longitude: 6.6389 }, type: 'Marina' },
  { name: 'Port de Pampelonne', country: 'France', city: 'Saint-Tropez', coordinates: { latitude: 43.2694, longitude: 6.6389 }, type: 'Marina' },
  { name: 'Port Grimaud', country: 'France', city: 'Saint-Tropez', coordinates: { latitude: 43.2694, longitude: 6.6389 }, type: 'Marina' },
  
  // Mediterranean - Italy
  { name: 'Porto di Genova', country: 'Italy', city: 'Genoa', coordinates: { latitude: 44.4056, longitude: 8.9463 }, type: 'Marina' },
  { name: 'Porto di Portofino', country: 'Italy', city: 'Portofino', coordinates: { latitude: 44.3033, longitude: 9.2094 }, type: 'Marina' },
  { name: 'Porto di Rapallo', country: 'Italy', city: 'Rapallo', coordinates: { latitude: 44.3497, longitude: 9.2278 }, type: 'Marina' },
  { name: 'Porto di Santa Margherita', country: 'Italy', city: 'Santa Margherita Ligure', coordinates: { latitude: 44.3347, longitude: 9.2103 }, type: 'Marina' },
  { name: 'Porto di Viareggio', country: 'Italy', city: 'Viareggio', coordinates: { latitude: 43.8739, longitude: 10.2333 }, type: 'Marina' },
  { name: 'Porto di Livorno', country: 'Italy', city: 'Livorno', coordinates: { latitude: 43.5481, longitude: 10.3100 }, type: 'Marina' },
  { name: 'Porto di Civitavecchia', country: 'Italy', city: 'Civitavecchia', coordinates: { latitude: 42.0933, longitude: 11.7967 }, type: 'Marina' },
  { name: 'Porto di Roma', country: 'Italy', city: 'Rome', coordinates: { latitude: 41.9028, longitude: 12.4964 }, type: 'Marina' },
  { name: 'Porto di Napoli', country: 'Italy', city: 'Naples', coordinates: { latitude: 40.8518, longitude: 14.2681 }, type: 'Marina' },
  { name: 'Porto di Salerno', country: 'Italy', city: 'Salerno', coordinates: { latitude: 40.6824, longitude: 14.7681 }, type: 'Marina' },
  { name: 'Porto di Palermo', country: 'Italy', city: 'Palermo', coordinates: { latitude: 38.1157, longitude: 13.3615 }, type: 'Marina' },
  { name: 'Porto di Catania', country: 'Italy', city: 'Catania', coordinates: { latitude: 37.5079, longitude: 15.0830 }, type: 'Marina' },
  { name: 'Porto di Siracusa', country: 'Italy', city: 'Syracuse', coordinates: { latitude: 37.0755, longitude: 15.2866 }, type: 'Marina' },
  { name: 'Porto di Taormina', country: 'Italy', city: 'Taormina', coordinates: { latitude: 37.8521, longitude: 15.2889 }, type: 'Marina' },
  
  // Mediterranean - Spain
  { name: 'Puerto de Barcelona', country: 'Spain', city: 'Barcelona', coordinates: { latitude: 41.3851, longitude: 2.1734 }, type: 'Marina' },
  { name: 'Port Vell', country: 'Spain', city: 'Barcelona', coordinates: { latitude: 41.3851, longitude: 2.1734 }, type: 'Marina' },
  { name: 'Puerto de Valencia', country: 'Spain', city: 'Valencia', coordinates: { latitude: 39.4699, longitude: -0.3763 }, type: 'Marina' },
  { name: 'Puerto de Alicante', country: 'Spain', city: 'Alicante', coordinates: { latitude: 38.3452, longitude: -0.4815 }, type: 'Marina' },
  { name: 'Puerto de Málaga', country: 'Spain', city: 'Málaga', coordinates: { latitude: 36.7213, longitude: -4.4217 }, type: 'Marina' },
  { name: 'Puerto de Marbella', country: 'Spain', city: 'Marbella', coordinates: { latitude: 36.5097, longitude: -4.8862 }, type: 'Marina' },
  { name: 'Puerto Banús', country: 'Spain', city: 'Marbella', coordinates: { latitude: 36.4853, longitude: -4.9556 }, type: 'Marina' },
  { name: 'Puerto de Gibraltar', country: 'Gibraltar', city: 'Gibraltar', coordinates: { latitude: 36.1408, longitude: -5.3536 }, type: 'Marina' },
  
  // Mediterranean - Greece
  { name: 'Port of Piraeus', country: 'Greece', city: 'Athens', coordinates: { latitude: 37.9485, longitude: 23.6425 }, type: 'Marina' },
  { name: 'Marina Zea', country: 'Greece', city: 'Athens', coordinates: { latitude: 37.9485, longitude: 23.6425 }, type: 'Marina' },
  { name: 'Port of Rhodes', country: 'Greece', city: 'Rhodes', coordinates: { latitude: 36.4344, longitude: 28.2176 }, type: 'Marina' },
  { name: 'Port of Mykonos', country: 'Greece', city: 'Mykonos', coordinates: { latitude: 37.4467, longitude: 25.3289 }, type: 'Marina' },
  { name: 'Port of Santorini', country: 'Greece', city: 'Santorini', coordinates: { latitude: 36.3932, longitude: 25.4615 }, type: 'Marina' },
  { name: 'Port of Corfu', country: 'Greece', city: 'Corfu', coordinates: { latitude: 39.6243, longitude: 19.9217 }, type: 'Marina' },
  { name: 'Port of Crete', country: 'Greece', city: 'Heraklion', coordinates: { latitude: 35.3387, longitude: 25.1442 }, type: 'Marina' },
  
  // Mediterranean - Croatia
  { name: 'Port of Split', country: 'Croatia', city: 'Split', coordinates: { latitude: 43.5081, longitude: 16.4402 }, type: 'Marina' },
  { name: 'Port of Dubrovnik', country: 'Croatia', city: 'Dubrovnik', coordinates: { latitude: 42.6507, longitude: 18.0944 }, type: 'Marina' },
  { name: 'Port of Zadar', country: 'Croatia', city: 'Zadar', coordinates: { latitude: 44.1194, longitude: 15.2314 }, type: 'Marina' },
  { name: 'Port of Rijeka', country: 'Croatia', city: 'Rijeka', coordinates: { latitude: 45.3271, longitude: 14.4422 }, type: 'Marina' },
  
  // Mediterranean - Monaco
  { name: 'Port Hercule', country: 'Monaco', city: 'Monte Carlo', coordinates: { latitude: 43.7384, longitude: 7.4246 }, type: 'Marina' },
  { name: 'Port de Fontvieille', country: 'Monaco', city: 'Monte Carlo', coordinates: { latitude: 43.7384, longitude: 7.4246 }, type: 'Marina' },
  
  // North America - United States (Florida)
  { name: 'Port of Miami', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7617, longitude: -80.1918 }, type: 'Marina' },
  { name: 'Biscayne Bay Marina', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7617, longitude: -80.1918 }, type: 'Marina' },
  { name: 'Miami Beach Marina', country: 'United States', city: 'Miami Beach', coordinates: { latitude: 25.7907, longitude: -80.1300 }, type: 'Marina' },
  { name: 'Port Everglades', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1224, longitude: -80.1373 }, type: 'Marina' },
  { name: 'Bahia Mar Marina', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1224, longitude: -80.1373 }, type: 'Marina' },
  { name: 'Las Olas Marina', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1224, longitude: -80.1373 }, type: 'Marina' },
  { name: 'Palm Beach Marina', country: 'United States', city: 'Palm Beach', coordinates: { latitude: 26.7056, longitude: -80.0364 }, type: 'Marina' },
  { name: 'Port of Palm Beach', country: 'United States', city: 'Palm Beach', coordinates: { latitude: 26.7056, longitude: -80.0364 }, type: 'Marina' },
  { name: 'Naples Bay Marina', country: 'United States', city: 'Naples', coordinates: { latitude: 26.1420, longitude: -81.7948 }, type: 'Marina' },
  { name: 'Marco Island Marina', country: 'United States', city: 'Marco Island', coordinates: { latitude: 25.9412, longitude: -81.7329 }, type: 'Marina' },
  { name: 'Key West Marina', country: 'United States', city: 'Key West', coordinates: { latitude: 24.5551, longitude: -81.7800 }, type: 'Marina' },
  { name: 'Galleon Marina', country: 'United States', city: 'Key West', coordinates: { latitude: 24.5551, longitude: -81.7800 }, type: 'Marina' },
  { name: 'Port of Tampa', country: 'United States', city: 'Tampa', coordinates: { latitude: 27.9506, longitude: -82.4572 }, type: 'Marina' },
  { name: 'St. Petersburg Marina', country: 'United States', city: 'St. Petersburg', coordinates: { latitude: 27.7731, longitude: -82.6400 }, type: 'Marina' },
  { name: 'Clearwater Marina', country: 'United States', city: 'Clearwater', coordinates: { latitude: 27.9659, longitude: -82.8001 }, type: 'Marina' },
  { name: 'Sarasota Marina', country: 'United States', city: 'Sarasota', coordinates: { latitude: 27.3364, longitude: -82.5307 }, type: 'Marina' },
  
  // North America - United States (Other Coastal)
  { name: 'Newport Marina', country: 'United States', city: 'Newport', coordinates: { latitude: 41.4901, longitude: -71.3128 }, type: 'Marina' },
  { name: 'San Diego Marina', country: 'United States', city: 'San Diego', coordinates: { latitude: 32.7157, longitude: -117.1611 }, type: 'Marina' },
  { name: 'San Francisco Marina', country: 'United States', city: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 }, type: 'Marina' },
  { name: 'Seattle Marina', country: 'United States', city: 'Seattle', coordinates: { latitude: 47.6062, longitude: -122.3321 }, type: 'Marina' },
  
  // Caribbean
  { name: 'Nassau Marina', country: 'Bahamas', city: 'Nassau', coordinates: { latitude: 25.0343, longitude: -77.3963 }, type: 'Marina' },
  { name: 'Paradise Island Marina', country: 'Bahamas', city: 'Nassau', coordinates: { latitude: 25.0343, longitude: -77.3963 }, type: 'Marina' },
  { name: 'Road Town Marina', country: 'British Virgin Islands', city: 'Road Town', coordinates: { latitude: 18.4286, longitude: -64.6185 }, type: 'Marina' },
  { name: 'Tortola Marina', country: 'British Virgin Islands', city: 'Tortola', coordinates: { latitude: 18.4286, longitude: -64.6185 }, type: 'Marina' },
  { name: 'St. John\'s Marina', country: 'Antigua and Barbuda', city: 'St. John\'s', coordinates: { latitude: 17.1185, longitude: -61.8449 }, type: 'Marina' },
  { name: 'Marigot Marina', country: 'St. Martin', city: 'Marigot', coordinates: { latitude: 18.0708, longitude: -63.0501 }, type: 'Marina' },
  { name: 'Gustavia Marina', country: 'St. Barts', city: 'Gustavia', coordinates: { latitude: 17.8964, longitude: -62.8522 }, type: 'Marina' },
  { name: 'Basseterre Marina', country: 'St. Kitts and Nevis', city: 'Basseterre', coordinates: { latitude: 17.2955, longitude: -62.7250 }, type: 'Marina' },
  { name: 'Castries Marina', country: 'St. Lucia', city: 'Castries', coordinates: { latitude: 14.0101, longitude: -61.0064 }, type: 'Marina' },
  { name: 'Bridgetown Marina', country: 'Barbados', city: 'Bridgetown', coordinates: { latitude: 13.1132, longitude: -59.5988 }, type: 'Marina' },
  { name: 'St. George\'s Marina', country: 'Grenada', city: 'St. George\'s', coordinates: { latitude: 12.0564, longitude: -61.7485 }, type: 'Marina' },
  { name: 'Roseau Marina', country: 'Dominica', city: 'Roseau', coordinates: { latitude: 15.3010, longitude: -61.3881 }, type: 'Marina' }
];

// Sync yacht ports to database
const syncYachtPorts = async (country = null, limit = 100) => {
  try {
    console.log('🔄 Starting yacht port sync from comprehensive database...');
    
    let portsToSync = COMPREHENSIVE_YACHT_PORTS;
    
    // Filter by country if specified
    if (country) {
      portsToSync = portsToSync.filter(port => 
        port.country.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    // Apply limit
    portsToSync = portsToSync.slice(0, limit);
    
    if (portsToSync.length === 0) {
      console.log('No yacht ports found to sync');
      return { added: 0, updated: 0, skipped: 0, total: 0 };
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    console.log(`Processing ${portsToSync.length} yacht ports...`);
    
    // Process each yacht port
    for (const port of portsToSync) {
      const portData = {
        country: port.country,
        city: port.city,
        port: port.name,
        region: getRegionFromCountry(port.country),
        coordinates: port.coordinates,
        isActive: true
      };
      
      // Skip if missing required fields
      if (!portData.country || !portData.city || !portData.port) {
        skippedCount++;
        continue;
      }
      
      // Check if location already exists
      const existingLocation = await Location.findOne({
        country: portData.country,
        city: portData.city,
        port: portData.port
      });
      
      if (existingLocation) {
        // Update existing location with new coordinates if available
        if (portData.coordinates.latitude && portData.coordinates.longitude) {
          existingLocation.coordinates = portData.coordinates;
          await existingLocation.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Add new location
        const newLocation = new Location(portData);
        await newLocation.save();
        addedCount++;
      }
    }
    
    return { added: addedCount, updated: updatedCount, skipped: skippedCount, total: portsToSync.length };
    
  } catch (error) {
    console.error('Error syncing yacht ports:', error);
    throw error;
  }
};

// Main sync function
const mainSync = async () => {
  try {
    await connectDB();
    
    console.log('🚢 Yacht Port Database Sync Tool');
    console.log('================================\n');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const country = args[0] || null;
    const limit = parseInt(args[1]) || 100;
    
    if (country) {
      console.log(`Syncing yacht ports for: ${country}`);
    } else {
      console.log('Syncing all yacht ports');
    }
    
    console.log(`Limit: ${limit} ports per request\n`);
    
    // Perform sync
    const stats = await syncYachtPorts(country, limit);
    
    console.log('\n✅ Sync completed successfully!');
    console.log('📊 Statistics:');
    console.log(`   Added: ${stats.added} new ports`);
    console.log(`   Updated: ${stats.updated} existing ports`);
    console.log(`   Skipped: ${stats.skipped} invalid entries`);
    console.log(`   Total processed: ${stats.total} facilities`);
    
    // Show database summary
    const totalLocations = await Location.countDocuments();
    const activeLocations = await Location.countDocuments({ isActive: true });
    
    console.log('\n📈 Database Summary:');
    console.log(`   Total locations: ${totalLocations}`);
    console.log(`   Active locations: ${activeLocations}`);
    
    // Show top countries
    const topCountries = await Location.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('\n🌍 Top Countries:');
    topCountries.forEach((country, index) => {
      console.log(`   ${index + 1}. ${country._id}: ${country.count} ports`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
};

// Run the sync
mainSync();
