import Location from '../models/Location.js';

// Get all countries
export const getCountries = async (req, res) => {
  try {
    const countries = await Location.distinct('country', { isActive: true });
    res.json(countries.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get cities by country
export const getCitiesByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    const cities = await Location.distinct('city', { 
      country: country, 
      isActive: true 
    });
    res.json(cities.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ports by city
export const getPortsByCity = async (req, res) => {
  try {
    const { country, city } = req.params;
    const ports = await Location.distinct('port', { 
      country: country, 
      city: city, 
      isActive: true,
      port: { $exists: true, $ne: '' }
    });
    res.json(ports.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all locations (for admin purposes)
export const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true })
      .sort({ country: 1, city: 1, port: 1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new location (admin only)
export const addLocation = async (req, res) => {
  try {
    const { country, city, port, region, coordinates } = req.body;
    
    if (!country || !city) {
      return res.status(400).json({ message: 'Country and city are required' });
    }

    // Check if location already exists
    const existingLocation = await Location.findOne({
      country: country,
      city: city,
      port: port || ''
    });

    if (existingLocation) {
      return res.status(400).json({ message: 'Location already exists' });
    }

    const location = new Location({
      country,
      city,
      port,
      region,
      coordinates
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search locations
export const searchLocations = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const locations = await Location.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { country: { $regex: query, $options: 'i' } },
            { city: { $regex: query, $options: 'i' } },
            { port: { $regex: query, $options: 'i' } },
            { region: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .limit(20)
    .sort({ country: 1, city: 1 });

    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get popular yacht locations
export const getPopularLocations = async (req, res) => {
  try {
    const popularLocations = [
      { country: 'Monaco', city: 'Monte Carlo', port: 'Port Hercule' },
      { country: 'France', city: 'Antibes', port: 'Port Vauban' },
      { country: 'France', city: 'Cannes', port: 'Port de Cannes' },
      { country: 'Italy', city: 'Genoa', port: 'Porto di Genova' },
      { country: 'Italy', city: 'Naples', port: 'Porto di Napoli' },
      { country: 'Spain', city: 'Barcelona', port: 'Port Vell' },
      { country: 'Spain', city: 'Palma de Mallorca', port: 'Puerto de Palma' },
      { country: 'Greece', city: 'Athens', port: 'Piraeus Port' },
      { country: 'Croatia', city: 'Split', port: 'Port of Split' },
      { country: 'Turkey', city: 'Istanbul', port: 'Port of Istanbul' },
      { country: 'United States', city: 'Miami', port: 'PortMiami' },
      { country: 'United States', city: 'Fort Lauderdale', port: 'Port Everglades' },
      { country: 'United States', city: 'Newport', port: 'Newport Harbor' },
      { country: 'Bahamas', city: 'Nassau', port: 'Nassau Harbor' },
      { country: 'British Virgin Islands', city: 'Road Town', port: 'Road Town Harbor' },
      { country: 'Antigua and Barbuda', city: 'St. John\'s', port: 'St. John\'s Harbor' },
      { country: 'St. Martin', city: 'Marigot', port: 'Port de Marigot' },
      { country: 'St. Barts', city: 'Gustavia', port: 'Port de Gustavia' },
      { country: 'Seychelles', city: 'Victoria', port: 'Port Victoria' },
      { country: 'Maldives', city: 'Male', port: 'Port of Male' },
      { country: 'Thailand', city: 'Phuket', port: 'Port of Phuket' },
      { country: 'Singapore', city: 'Singapore', port: 'Marina Bay' },
      { country: 'Australia', city: 'Sydney', port: 'Sydney Harbor' },
      { country: 'New Zealand', city: 'Auckland', port: 'Ports of Auckland' }
    ];

    res.json(popularLocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all ports (for dynamic port selection)
export const getAllPorts = async (req, res) => {
  try {
    const { country, city } = req.query;
    
    let filter = { 
      isActive: true,
      port: { $exists: true, $ne: '' }
    };
    
    // If country is provided, filter by country
    if (country) {
      filter.country = country;
    }
    
    // If city is provided, filter by city
    if (city) {
      filter.city = city;
    }
    
    const ports = await Location.distinct('port', filter);
    
    // Sort ports alphabetically
    const sortedPorts = ports.sort();
    
    res.json({
      success: true,
      count: sortedPorts.length,
      ports: sortedPorts
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Comprehensive yacht port database for when external APIs fail
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
  
  // Mediterranean - Monaco
  { name: 'Port Hercule', country: 'Monaco', city: 'Monte Carlo', coordinates: { latitude: 43.7384, longitude: 7.4246 }, type: 'Marina' },
  
  // Mediterranean - Italy
  { name: 'Porto di Genova', country: 'Italy', city: 'Genoa', coordinates: { latitude: 44.4056, longitude: 8.9463 }, type: 'Marina' },
  { name: 'Porto di Napoli', country: 'Italy', city: 'Naples', coordinates: { latitude: 40.8518, longitude: 14.2681 }, type: 'Marina' },
  { name: 'Porto di Portofino', country: 'Italy', city: 'Portofino', coordinates: { latitude: 44.3033, longitude: 9.2094 }, type: 'Marina' },
  { name: 'Porto di Capri', country: 'Italy', city: 'Capri', coordinates: { latitude: 40.5500, longitude: 14.2333 }, type: 'Marina' },
  { name: 'Porto di Olbia', country: 'Italy', city: 'Sardinia', coordinates: { latitude: 40.9236, longitude: 9.4989 }, type: 'Marina' },
  
  // Mediterranean - Spain
  { name: 'Port Vell', country: 'Spain', city: 'Barcelona', coordinates: { latitude: 41.3754, longitude: 2.1833 }, type: 'Marina' },
  { name: 'Puerto de Palma', country: 'Spain', city: 'Palma de Mallorca', coordinates: { latitude: 39.5696, longitude: 2.6502 }, type: 'Marina' },
  { name: 'Puerto de Ibiza', country: 'Spain', city: 'Ibiza', coordinates: { latitude: 38.9089, longitude: 1.4324 }, type: 'Marina' },
  { name: 'Puerto Banús', country: 'Spain', city: 'Marbella', coordinates: { latitude: 36.4853, longitude: -4.9557 }, type: 'Marina' },
  
  // Mediterranean - Greece
  { name: 'Piraeus Port', country: 'Greece', city: 'Athens', coordinates: { latitude: 37.9485, longitude: 23.6425 }, type: 'Marina' },
  { name: 'Port of Mykonos', country: 'Greece', city: 'Mykonos', coordinates: { latitude: 37.4467, longitude: 25.3289 }, type: 'Marina' },
  { name: 'Port of Santorini', country: 'Greece', city: 'Santorini', coordinates: { latitude: 36.3932, longitude: 25.4615 }, type: 'Marina' },
  
  // Mediterranean - Croatia
  { name: 'Port of Split', country: 'Croatia', city: 'Split', coordinates: { latitude: 43.5081, longitude: 16.4402 }, type: 'Marina' },
  { name: 'Port of Dubrovnik', country: 'Croatia', city: 'Dubrovnik', coordinates: { latitude: 42.6507, longitude: 18.0944 }, type: 'Marina' },
  
  // Mediterranean - Turkey
  { name: 'Port of Istanbul', country: 'Turkey', city: 'Istanbul', coordinates: { latitude: 41.0082, longitude: 28.9784 }, type: 'Marina' },
  { name: 'Port of Antalya', country: 'Turkey', city: 'Antalya', coordinates: { latitude: 36.8969, longitude: 30.7133 }, type: 'Marina' },
  
  // Mediterranean - Malta
  { name: 'Grand Harbour', country: 'Malta', city: 'Valletta', coordinates: { latitude: 35.8997, longitude: 14.5172 }, type: 'Marina' },
  
  // Caribbean - Bahamas
  { name: 'Nassau Harbor', country: 'Bahamas', city: 'Nassau', coordinates: { latitude: 25.0343, longitude: -77.3963 }, type: 'Marina' },
  { name: 'Port Lucaya', country: 'Bahamas', city: 'Freeport', coordinates: { latitude: 26.5285, longitude: -78.6967 }, type: 'Marina' },
  
  // Caribbean - British Virgin Islands
  { name: 'Road Town Harbor', country: 'British Virgin Islands', city: 'Road Town', coordinates: { latitude: 18.4204, longitude: -64.6200 }, type: 'Marina' },
  { name: 'Port of Tortola', country: 'British Virgin Islands', city: 'Tortola', coordinates: { latitude: 18.4204, longitude: -64.6200 }, type: 'Marina' },
  
  // Caribbean - Other Islands
  { name: 'St. John\'s Harbor', country: 'Antigua and Barbuda', city: 'St. John\'s', coordinates: { latitude: 17.1185, longitude: -61.8449 }, type: 'Marina' },
  { name: 'Port de Marigot', country: 'St. Martin', city: 'Marigot', coordinates: { latitude: 18.0708, longitude: -63.0851 }, type: 'Marina' },
  { name: 'Port de Gustavia', country: 'St. Barts', city: 'Gustavia', coordinates: { latitude: 17.8964, longitude: -62.8498 }, type: 'Marina' },
  { name: 'Port Zante', country: 'St. Kitts and Nevis', city: 'Basseterre', coordinates: { latitude: 17.2955, longitude: -62.7250 }, type: 'Marina' },
  { name: 'Port of Castries', country: 'St. Lucia', city: 'Castries', coordinates: { latitude: 14.0101, longitude: -61.0064 }, type: 'Marina' },
  { name: 'Port of Bridgetown', country: 'Barbados', city: 'Bridgetown', coordinates: { latitude: 13.1132, longitude: -59.5988 }, type: 'Marina' },
  
  // Indian Ocean
  { name: 'Port Victoria', country: 'Seychelles', city: 'Victoria', coordinates: { latitude: -4.6203, longitude: 55.4514 }, type: 'Marina' },
  { name: 'Port of Male', country: 'Maldives', city: 'Male', coordinates: { latitude: 4.1755, longitude: 73.5093 }, type: 'Marina' },
  { name: 'Port of Port Louis', country: 'Mauritius', city: 'Port Louis', coordinates: { latitude: -20.1609, longitude: 57.5012 }, type: 'Marina' },
  
  // Asia Pacific
  { name: 'Port of Phuket', country: 'Thailand', city: 'Phuket', coordinates: { latitude: 7.8804, longitude: 98.3923 }, type: 'Marina' },
  { name: 'Port of Koh Samui', country: 'Thailand', city: 'Koh Samui', coordinates: { latitude: 9.5120, longitude: 100.0136 }, type: 'Marina' },
  { name: 'Marina Bay', country: 'Singapore', city: 'Singapore', coordinates: { latitude: 1.2847, longitude: 103.8523 }, type: 'Marina' },
  { name: 'Port of Langkawi', country: 'Malaysia', city: 'Langkawi', coordinates: { latitude: 6.3500, longitude: 99.8000 }, type: 'Marina' },
  { name: 'Port of Benoa', country: 'Indonesia', city: 'Bali', coordinates: { latitude: -8.7481, longitude: 115.2197 }, type: 'Marina' },
  { name: 'Port of Manila', country: 'Philippines', city: 'Manila', coordinates: { latitude: 14.5995, longitude: 120.9842 }, type: 'Marina' },
  
  // Australia & New Zealand
  { name: 'Sydney Harbor', country: 'Australia', city: 'Sydney', coordinates: { latitude: -33.8688, longitude: 151.2093 }, type: 'Marina' },
  { name: 'Marina Mirage', country: 'Australia', city: 'Gold Coast', coordinates: { latitude: -27.9706, longitude: 153.4205 }, type: 'Marina' },
  { name: 'Fremantle Port', country: 'Australia', city: 'Perth', coordinates: { latitude: -32.0569, longitude: 115.7439 }, type: 'Marina' },
  { name: 'Ports of Auckland', country: 'New Zealand', city: 'Auckland', coordinates: { latitude: -36.8485, longitude: 174.7633 }, type: 'Marina' },
  { name: 'Port of Wellington', country: 'New Zealand', city: 'Wellington', coordinates: { latitude: -41.2866, longitude: 174.7756 }, type: 'Marina' },
  
  // North America - United States (Florida - Major Yachting Destination)
  { name: 'PortMiami', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7617, longitude: -80.1918 }, type: 'Marina' },
  { name: 'Miami Beach Marina', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7907, longitude: -80.1300 }, type: 'Marina' },
  { name: 'Brickell Key Marina', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7633, longitude: -80.1850 }, type: 'Marina' },
  { name: 'Dinner Key Marina', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7197, longitude: -80.2244 }, type: 'Marina' },
  { name: 'Miami Yacht Club', country: 'United States', city: 'Miami', coordinates: { latitude: 25.7633, longitude: -80.1850 }, type: 'Marina' },
  
  { name: 'Port Everglades', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1224, longitude: -80.1373 }, type: 'Marina' },
  { name: 'Bahia Mar Marina', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1187, longitude: -80.1053 }, type: 'Marina' },
  { name: 'Las Olas Marina', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1187, longitude: -80.1053 }, type: 'Marina' },
  { name: 'Pier 66 Marina', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1187, longitude: -80.1053 }, type: 'Marina' },
  { name: 'Fort Lauderdale Marina', country: 'United States', city: 'Fort Lauderdale', coordinates: { latitude: 26.1187, longitude: -80.1053 }, type: 'Marina' },
  
  { name: 'Palm Beach Marina', country: 'United States', city: 'Palm Beach', coordinates: { latitude: 26.7056, longitude: -80.0364 }, type: 'Marina' },
  { name: 'Palm Harbor Marina', country: 'United States', city: 'Palm Beach', coordinates: { latitude: 26.7056, longitude: -80.0364 }, type: 'Marina' },
  { name: 'Sailfish Marina', country: 'United States', city: 'Palm Beach', coordinates: { latitude: 26.7056, longitude: -80.0364 }, type: 'Marina' },
  
  { name: 'Naples Bay Marina', country: 'United States', city: 'Naples', coordinates: { latitude: 26.1420, longitude: -81.7948 }, type: 'Marina' },
  { name: 'Naples City Dock', country: 'United States', city: 'Naples', coordinates: { latitude: 26.1420, longitude: -81.7948 }, type: 'Marina' },
  { name: 'Port of Naples', country: 'United States', city: 'Naples', coordinates: { latitude: 26.1420, longitude: -81.7948 }, type: 'Marina' },
  
  { name: 'Marco Island Marina', country: 'United States', city: 'Marco Island', coordinates: { latitude: 25.9412, longitude: -81.7284 }, type: 'Marina' },
  { name: 'Esplanade Marina', country: 'United States', city: 'Marco Island', coordinates: { latitude: 25.9412, longitude: -81.7284 }, type: 'Marina' },
  
  { name: 'Key West Marina', country: 'United States', city: 'Key West', coordinates: { latitude: 24.5551, longitude: -81.7800 }, type: 'Marina' },
  { name: 'Galleon Marina', country: 'United States', city: 'Key West', coordinates: { latitude: 24.5551, longitude: -81.7800 }, type: 'Marina' },
  { name: 'Conch Harbor Marina', country: 'United States', city: 'Key West', coordinates: { latitude: 24.5551, longitude: -81.7800 }, type: 'Marina' },
  { name: 'Key West Bight Marina', country: 'United States', city: 'Key West', coordinates: { latitude: 24.5551, longitude: -81.7800 }, type: 'Marina' },
  
  { name: 'Tampa Bay Marina', country: 'United States', city: 'Tampa', coordinates: { latitude: 27.9506, longitude: -82.4572 }, type: 'Marina' },
  { name: 'Harbour Island Marina', country: 'United States', city: 'Tampa', coordinates: { latitude: 27.9506, longitude: -82.4572 }, type: 'Marina' },
  { name: 'Davis Islands Marina', country: 'United States', city: 'Tampa', coordinates: { latitude: 27.9506, longitude: -82.4572 }, type: 'Marina' },
  
  { name: 'St. Petersburg Marina', country: 'United States', city: 'St. Petersburg', coordinates: { latitude: 27.7731, longitude: -82.6400 }, type: 'Marina' },
  { name: 'Downtown Marina', country: 'United States', city: 'St. Petersburg', coordinates: { latitude: 27.7731, longitude: -82.6400 }, type: 'Marina' },
  { name: 'Vinoy Marina', country: 'United States', city: 'St. Petersburg', coordinates: { latitude: 27.7731, longitude: -82.6400 }, type: 'Marina' },
  
  { name: 'Clearwater Marina', country: 'United States', city: 'Clearwater', coordinates: { latitude: 27.9659, longitude: -82.8001 }, type: 'Marina' },
  { name: 'Clearwater Beach Marina', country: 'United States', city: 'Clearwater', coordinates: { latitude: 27.9659, longitude: -82.8001 }, type: 'Marina' },
  
  { name: 'Sarasota Marina', country: 'United States', city: 'Sarasota', coordinates: { latitude: 27.3364, longitude: -82.5307 }, type: 'Marina' },
  { name: 'Marina Jack', country: 'United States', city: 'Sarasota', coordinates: { latitude: 27.3364, longitude: -82.5307 }, type: 'Marina' },
  { name: 'Sarasota Bay Marina', country: 'United States', city: 'Sarasota', coordinates: { latitude: 27.3364, longitude: -82.5307 }, type: 'Marina' },
  
  // Other US Coastal Cities
  { name: 'Newport Harbor', country: 'United States', city: 'Newport', coordinates: { latitude: 41.4901, longitude: -71.3128 }, type: 'Marina' },
  { name: 'Newport Shipyard', country: 'United States', city: 'Newport', coordinates: { latitude: 41.4901, longitude: -71.3128 }, type: 'Marina' },
  { name: 'Bannister\'s Wharf Marina', country: 'United States', city: 'Newport', coordinates: { latitude: 41.4901, longitude: -71.3128 }, type: 'Marina' },
  
  { name: 'Port of San Diego', country: 'United States', city: 'San Diego', coordinates: { latitude: 32.7157, longitude: -117.1611 }, type: 'Marina' },
  { name: 'San Diego Bay Marina', country: 'United States', city: 'San Diego', coordinates: { latitude: 32.7157, longitude: -117.1611 }, type: 'Marina' },
  { name: 'Shelter Island Marina', country: 'United States', city: 'San Diego', coordinates: { latitude: 32.7157, longitude: -117.1611 }, type: 'Marina' },
  { name: 'Point Loma Marina', country: 'United States', city: 'San Diego', coordinates: { latitude: 32.7157, longitude: -117.1611 }, type: 'Marina' },
  
  { name: 'Port of San Francisco', country: 'United States', city: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 }, type: 'Marina' },
  { name: 'Pier 39 Marina', country: 'United States', city: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 }, type: 'Marina' },
  { name: 'South Beach Marina', country: 'United States', city: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 }, type: 'Marina' },
  { name: 'Fisherman\'s Wharf Marina', country: 'United States', city: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 }, type: 'Marina' },
  
  { name: 'Port of Seattle', country: 'United States', city: 'Seattle', coordinates: { latitude: 47.6062, longitude: -122.3321 }, type: 'Marina' },
  { name: 'Elliott Bay Marina', country: 'United States', city: 'Seattle', coordinates: { latitude: 47.6062, longitude: -122.3321 }, type: 'Marina' },
  { name: 'Shilshole Bay Marina', country: 'United States', city: 'Seattle', coordinates: { latitude: 47.6062, longitude: -122.3321 }, type: 'Marina' },
  { name: 'Lake Union Marina', country: 'United States', city: 'Seattle', coordinates: { latitude: 47.6062, longitude: -122.3321 }, type: 'Marina' },
  
  // North America - Canada
  { name: 'Port of Vancouver', country: 'Canada', city: 'Vancouver', coordinates: { latitude: 49.2827, longitude: -123.1207 }, type: 'Marina' },
  { name: 'Port of Toronto', country: 'Canada', city: 'Toronto', coordinates: { latitude: 43.6532, longitude: -79.3832 }, type: 'Marina' },
  
  // Europe
  { name: 'Port of London', country: 'United Kingdom', city: 'London', coordinates: { latitude: 51.5074, longitude: -0.1278 }, type: 'Marina' },
  { name: 'Port of Southampton', country: 'United Kingdom', city: 'Southampton', coordinates: { latitude: 50.9097, longitude: -1.4044 }, type: 'Marina' },
  { name: 'Port of Amsterdam', country: 'Netherlands', city: 'Amsterdam', coordinates: { latitude: 52.3676, longitude: 4.9041 }, type: 'Marina' },
  { name: 'Port of Hamburg', country: 'Germany', city: 'Hamburg', coordinates: { latitude: 53.5511, longitude: 9.9937 }, type: 'Marina' },
  { name: 'Port of Oslo', country: 'Norway', city: 'Oslo', coordinates: { latitude: 59.9139, longitude: 10.7522 }, type: 'Marina' },
  { name: 'Port of Stockholm', country: 'Sweden', city: 'Stockholm', coordinates: { latitude: 59.3293, longitude: 18.0686 }, type: 'Marina' },
  { name: 'Port of Copenhagen', country: 'Denmark', city: 'Copenhagen', coordinates: { latitude: 55.6761, longitude: 12.5683 }, type: 'Marina' },
  
  // Middle East
  { name: 'Port Rashid', country: 'United Arab Emirates', city: 'Dubai', coordinates: { latitude: 25.2048, longitude: 55.2708 }, type: 'Marina' },
  { name: 'Port of Abu Dhabi', country: 'United Arab Emirates', city: 'Abu Dhabi', coordinates: { latitude: 24.4539, longitude: 54.3773 }, type: 'Marina' },
  { name: 'Port of Doha', country: 'Qatar', city: 'Doha', coordinates: { latitude: 25.2854, longitude: 51.5310 }, type: 'Marina' },
  { name: 'Port Sultan Qaboos', country: 'Oman', city: 'Muscat', coordinates: { latitude: 23.5880, longitude: 58.3829 }, type: 'Marina' },
  
  // South America
  { name: 'Port of Rio de Janeiro', country: 'Brazil', city: 'Rio de Janeiro', coordinates: { latitude: -22.9068, longitude: -43.1729 }, type: 'Marina' },
  { name: 'Port of Santos', country: 'Brazil', city: 'São Paulo', coordinates: { latitude: -23.5505, longitude: -46.6333 }, type: 'Marina' },
  { name: 'Port of Buenos Aires', country: 'Argentina', city: 'Buenos Aires', coordinates: { latitude: -34.6118, longitude: -58.3960 }, type: 'Marina' },
  { name: 'Port of Valparaíso', country: 'Chile', city: 'Valparaíso', coordinates: { latitude: -33.0472, longitude: -71.6127 }, type: 'Marina' }
];

// Fetch yacht ports from API (using reliable maritime data sources)
export const fetchYachtPortsFromAPI = async (req, res) => {
  try {
    const { country, city, limit = 50 } = req.query;
    
    // Try multiple reliable maritime APIs for yacht port data
    let yachtPorts = [];
    let apiSource = 'Local Database';
    
    // Option 1: Try OpenSeaMap Overpass API (most reliable public option)
    try {
      console.log('Fetching from OpenSeaMap Overpass API...');
      
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      let query = `
        [out:json][timeout:25];
        (
          node["amenity"="marina"];
          way["amenity"="marina"];
          relation["amenity"="marina"];
          node["leisure"="marina"];
          way["leisure"="marina"];
          relation["leisure"="marina"];
        );
        out body;
        >;
        out skel qt;
      `;
      
      // If country is specified, add geographic filter
      if (country) {
        query = `
          [out:json][timeout:25];
          area["name:en"="${country}"]["admin_level"="2"]->.country;
          (
            node["amenity"="marina"](area.country);
            way["amenity"="marina"](area.country);
            relation["amenity"="marina"](area.country);
            node["leisure"="marina"](area.country);
            way["leisure"="marina"](area.country);
            relation["leisure"="marina"](area.country);
          );
          out body;
          >;
          out skel qt;
        `;
      }
      
      const response = await fetch(overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'YachtJobPortal/1.0'
        },
        body: `data=${encodeURIComponent(query)}`
      });
      
      if (response.ok) {
        const data = await response.json();
        yachtPorts = data.elements?.map(element => ({
          name: element.tags?.name || element.tags?.alt_name || 'Unknown Marina',
          country: element.tags?.is_in?.split(',')[0]?.trim() || element.tags?.['addr:country'] || 'Unknown',
          city: element.tags?.is_in?.split(',')[1]?.trim() || element.tags?.['addr:city'] || 'Unknown',
          coordinates: {
            latitude: element.lat || 0,
            longitude: element.lon || 0
          },
          type: 'Marina',
          website: element.tags?.website,
          phone: element.tags?.phone,
          source: 'OpenSeaMap'
        })).filter(port => port.name && port.name !== 'Unknown Marina') || [];
        
        apiSource = 'OpenSeaMap Overpass API';
        console.log(`Found ${yachtPorts.length} marinas from OpenSeaMap`);
      }
    } catch (overpassError) {
      console.log('OpenSeaMap API failed, using comprehensive database...');
    }
    

    
    // Option 3: Use comprehensive yacht port database
    if (yachtPorts.length === 0) {
      console.log('Using comprehensive yacht port database...');
      yachtPorts = COMPREHENSIVE_YACHT_PORTS.map(port => ({
        ...port,
        source: 'Comprehensive Database'
      }));
      apiSource = 'Comprehensive Yacht Port Database';
    }
    
    // Filter by country/city if specified
    if (country) {
      yachtPorts = yachtPorts.filter(port => 
        port.country?.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    if (city) {
      yachtPorts = yachtPorts.filter(port => 
        port.city?.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    // Limit results
    yachtPorts = yachtPorts.slice(0, limit);
    
    // If still no data, fallback to local database
    if (yachtPorts.length === 0) {
      console.log('No API data available, using local database...');
      
      let filter = { isActive: true };
      if (country) filter.country = { $regex: country, $options: 'i' };
      if (city) filter.city = { $regex: city, $options: 'i' };
      
      const fallbackPorts = await Location.find(filter)
        .select('country city port coordinates')
        .limit(limit);
      
      yachtPorts = fallbackPorts.map(port => ({
        name: port.port,
        country: port.country,
        city: port.city,
        coordinates: port.coordinates,
        type: 'Marina',
        source: 'Local Database'
      }));
      
      apiSource = 'Local Database (API fallback)';
    }
    
    res.json({
      success: true,
      count: yachtPorts.length,
      ports: yachtPorts,
      source: apiSource,
      message: yachtPorts.length > 0 ? 'Data retrieved successfully' : 'No yacht ports found'
    });
    
  } catch (error) {
    console.error('Error fetching yacht ports:', error);
    
    // Final fallback to local database
    try {
      const { country, city } = req.query;
      let filter = { isActive: true };
      
      if (country) filter.country = { $regex: country, $options: 'i' };
      if (city) filter.city = { $regex: city, $options: 'i' };
      
      const fallbackPorts = await Location.find(filter)
        .select('country city port coordinates')
        .limit(50);
      
      const yachtPorts = fallbackPorts.map(port => ({
        name: port.port,
        country: port.country,
        city: port.city,
        coordinates: port.coordinates,
        type: 'Marina',
        source: 'Local Database'
      }));
      
      res.json({
        success: true,
        count: yachtPorts.length,
        ports: yachtPorts,
        source: 'Local Database (Error fallback)',
        message: 'Using local database due to API errors'
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve yacht ports',
        error: error.message
      });
    }
  }
};

// Sync yacht ports from API to database (updated for real APIs)
export const syncYachtPortsFromAPI = async (req, res) => {
  try {
    const { country, city, limit = 100 } = req.query;
    
    console.log('🔄 Starting yacht port sync from APIs...');
    
    let yachtPorts = [];
    let apiSource = 'Local Database';
    
    // Try to fetch from multiple sources
    const sources = [
      {
        name: 'World Ports Data',
        url: 'https://raw.githubusercontent.com/OpenSeaMap/openseamap/master/data/ports.json',
        method: 'GET',
        transform: (data) => data.ports?.map(port => ({
          country: port.country,
          city: port.city || port.town,
          port: port.name,
          coordinates: {
            latitude: port.lat,
            longitude: port.lon
          }
        })).filter(port => port.country && port.city && port.port) || []
      },
      {
        name: 'OpenSeaMap Overpass',
        url: 'https://overpass-api.de/api/interpreter',
        method: 'POST',
        body: `data=${encodeURIComponent(`
          [out:json][timeout:25];
          (
            node["leisure"="marina"](if:is_in("name"));
            way["leisure"="marina"](if:is_in("name"));
            relation["leisure"="marina"](if:is_in("name"));
          );
          out body;
          >;
          out skel qt;
        `)}`,
        transform: (data) => data.elements?.map(element => ({
          country: element.tags?.is_in?.split(',')[0]?.trim(),
          city: element.tags?.is_in?.split(',')[1]?.trim(),
          port: element.tags?.name,
          coordinates: {
            latitude: element.lat,
            longitude: element.lon
          }
        })).filter(port => port.country && port.city && port.port) || []
      }
    ];
    
    // Try each source
    for (const source of sources) {
      try {
        console.log(`Trying ${source.name}...`);
        
        const response = await fetch(source.url, {
          method: source.method,
          headers: {
            'User-Agent': 'YachtJobPortal/1.0',
            'Accept': 'application/json',
            ...(source.method === 'POST' && { 'Content-Type': 'application/x-www-form-urlencoded' })
          },
          ...(source.body && { body: source.body })
        });
        
        if (response.ok) {
          const data = await response.json();
          yachtPorts = source.transform(data);
          apiSource = source.name;
          console.log(`✅ Successfully fetched ${yachtPorts.length} ports from ${source.name}`);
          break;
        }
      } catch (error) {
        console.log(`❌ ${source.name} failed:`, error.message);
        continue;
      }
    }
    
    // If no API data, use local database as source
    if (yachtPorts.length === 0) {
      console.log('No API data available, using local database as source...');
      
      let filter = { isActive: true };
      if (country) filter.country = { $regex: country, $options: 'i' };
      if (city) filter.city = { $regex: city, $options: 'i' };
      
      const localPorts = await Location.find(filter).limit(limit);
      yachtPorts = localPorts.map(port => ({
        country: port.country,
        city: port.city,
        port: port.port,
        coordinates: port.coordinates
      }));
      
      apiSource = 'Local Database';
    }
    
    // Filter by country/city if specified
    if (country) {
      yachtPorts = yachtPorts.filter(port => 
        port.country?.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    if (city) {
      yachtPorts = yachtPorts.filter(port => 
        port.city?.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    // Limit results
    yachtPorts = yachtPorts.slice(0, limit);
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    console.log(`Processing ${yachtPorts.length} yacht facilities...`);
    
    // Process each yacht facility
    for (const portData of yachtPorts) {
      const locationData = {
        country: portData.country,
        city: portData.city,
        port: portData.port,
        region: getRegionFromCountry(portData.country),
        coordinates: portData.coordinates,
        isActive: true
      };
      
      // Skip if missing required fields
      if (!locationData.country || !locationData.city || !locationData.port) {
        skippedCount++;
        continue;
      }
      
      // Check if location already exists
      const existingLocation = await Location.findOne({
        country: locationData.country,
        city: locationData.city,
        port: locationData.port
      });
      
      if (existingLocation) {
        // Update existing location with new coordinates if available
        if (locationData.coordinates?.latitude && locationData.coordinates?.longitude) {
          existingLocation.coordinates = locationData.coordinates;
          await existingLocation.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Add new location
        const newLocation = new Location(locationData);
        await newLocation.save();
        addedCount++;
      }
    }
    
    res.json({
      success: true,
      message: 'Yacht port sync completed',
      source: apiSource,
      stats: {
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: yachtPorts.length
      }
    });
    
  } catch (error) {
    console.error('Error syncing yacht ports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync yacht ports',
      error: error.message
    });
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
