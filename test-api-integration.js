// Test script for API integration with OpenSeaMap
// This demonstrates fetching yacht port data from external APIs

const BASE_URL = 'http://localhost:8080/api/v1/locations';

async function testAPIIntegration() {
  console.log('🚢 Testing API Integration with OpenSeaMap\n');

  try {
    // Test 1: Fetch yacht ports from API (all)
    console.log('1. Fetching yacht ports from OpenSeaMap API...');
    const apiPortsResponse = await fetch(`${BASE_URL}/api-ports?limit=10`);
    const apiPortsData = await apiPortsResponse.json();
    
    if (apiPortsData.success) {
      console.log(`✅ Found ${apiPortsData.count} yacht ports from API`);
      console.log('Source:', apiPortsData.source);
      if (apiPortsData.ports.length > 0) {
        console.log('Sample ports:', apiPortsData.ports.slice(0, 3));
      }
    } else {
      console.log('❌ Failed to fetch from API');
    }

    // Test 2: Fetch yacht ports by country
    console.log('\n2. Fetching yacht ports for France from API...');
    const franceApiResponse = await fetch(`${BASE_URL}/api-ports?country=France&limit=5`);
    const franceApiData = await franceApiResponse.json();
    
    if (franceApiData.success) {
      console.log(`✅ Found ${franceApiData.count} yacht ports in France from API`);
      console.log('Source:', franceApiData.source);
      if (franceApiData.ports.length > 0) {
        console.log('French yacht ports:', franceApiData.ports);
      }
    } else {
      console.log('❌ Failed to fetch French ports from API');
    }

    // Test 3: Compare API data with local database
    console.log('\n3. Comparing API data with local database...');
    const localPortsResponse = await fetch(`${BASE_URL}/all-ports?country=France`);
    const localPortsData = await localPortsResponse.json();
    
    console.log(`Local database has ${localPortsData.count} ports in France`);
    console.log(`API has ${franceApiData.count} ports in France`);
    
    if (franceApiData.count > localPortsData.count) {
      console.log('🎉 API has more comprehensive data!');
    } else {
      console.log('📊 Local database has more data');
    }

    // Test 4: Test sync functionality (requires authentication)
    console.log('\n4. Testing sync functionality...');
    console.log('Note: Sync requires authentication. Use POST /api/v1/locations/sync-api');
    console.log('Example: curl -X POST http://localhost:3000/api/v1/locations/sync-api?country=France');

    console.log('\n🎉 API Integration Tests Completed!');
    console.log('\nAvailable endpoints:');
    console.log('- GET /api/v1/locations/api-ports (fetch from OpenSeaMap API)');
    console.log('- GET /api/v1/locations/api-ports?country=France (filter by country)');
    console.log('- POST /api/v1/locations/sync-api (sync API data to database)');
    console.log('- GET /api/v1/locations/all-ports (get from local database)');

    console.log('\nBenefits:');
    console.log('✅ Real-time yacht port data from OpenSeaMap');
    console.log('✅ Automatic fallback to local database');
    console.log('✅ Comprehensive marina and yacht facility information');
    console.log('✅ Geographic coordinates for mapping');
    console.log('✅ Regular updates from community-driven data');

  } catch (error) {
    console.error('❌ Error testing API integration:', error.message);
    console.log('\nMake sure your server is running on http://localhost:8080');
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testAPIIntegration();
}

export { testAPIIntegration };
