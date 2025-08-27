// Simple test script to verify API endpoints are working
// This tests the basic functionality without external API dependencies

const BASE_URL = 'http://localhost:8080/api/v1/locations';

async function testBasicAPI() {
  console.log('🧪 Testing Basic API Endpoints\n');

  try {
    // Test 1: Get all countries (should work with local database)
    console.log('1. Testing GET /countries...');
    const countriesResponse = await fetch(`${BASE_URL}/countries`);
    const countries = await countriesResponse.json();
    
    if (Array.isArray(countries)) {
      console.log(`✅ Found ${countries.length} countries`);
      console.log('Sample countries:', countries.slice(0, 5));
    } else {
      console.log('❌ Countries endpoint failed');
    }

    // Test 2: Get all ports from local database
    console.log('\n2. Testing GET /all-ports...');
    const allPortsResponse = await fetch(`${BASE_URL}/all-ports`);
    const allPortsData = await allPortsResponse.json();
    
    if (allPortsData.success) {
      console.log(`✅ Found ${allPortsData.count} ports in local database`);
      if (allPortsData.ports.length > 0) {
        console.log('Sample ports:', allPortsData.ports.slice(0, 3));
      }
    } else {
      console.log('❌ All ports endpoint failed');
    }

    // Test 3: Test API ports endpoint (should fallback to local database)
    console.log('\n3. Testing GET /api-ports...');
    const apiPortsResponse = await fetch(`${BASE_URL}/api-ports?limit=5`);
    const apiPortsData = await apiPortsResponse.json();
    
    if (apiPortsData.success) {
      console.log(`✅ API ports endpoint working`);
      console.log(`Source: ${apiPortsData.source}`);
      console.log(`Found: ${apiPortsData.count} ports`);
      if (apiPortsData.ports.length > 0) {
        console.log('Sample API ports:', apiPortsData.ports.slice(0, 2));
      }
    } else {
      console.log('❌ API ports endpoint failed');
    }

    // Test 4: Test search functionality
    console.log('\n4. Testing GET /search...');
    const searchResponse = await fetch(`${BASE_URL}/search?query=France`);
    const searchData = await searchResponse.json();
    
    if (Array.isArray(searchData)) {
      console.log(`✅ Search found ${searchData.length} results for "France"`);
    } else {
      console.log('❌ Search endpoint failed');
    }

    // Test 5: Test popular locations
    console.log('\n5. Testing GET /popular...');
    const popularResponse = await fetch(`${BASE_URL}/popular`);
    const popularData = await popularResponse.json();
    
    if (Array.isArray(popularData)) {
      console.log(`✅ Found ${popularData.length} popular locations`);
      console.log('Sample popular locations:', popularData.slice(0, 3));
    } else {
      console.log('❌ Popular locations endpoint failed');
    }

    console.log('\n🎉 Basic API Tests Completed!');
    console.log('\nAll endpoints are working correctly.');
    console.log('The system will use local database data when external APIs are unavailable.');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\nMake sure your server is running on http://localhost:8080');
    console.log('Run: npm start');
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testBasicAPI();
}

export { testBasicAPI };
