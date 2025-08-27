// Test script for the new all-ports API endpoint
// This demonstrates how to retrieve all ports dynamically

const BASE_URL = 'http://localhost:3000/api/v1/locations';

async function testAllPortsAPI() {
  console.log('🚢 Testing All Ports API Endpoint\n');

  try {
    // Test 1: Get all ports
    console.log('1. Getting all ports...');
    const allPortsResponse = await fetch(`${BASE_URL}/all-ports`);
    const allPortsData = await allPortsResponse.json();
    
    if (allPortsData.success) {
      console.log(`✅ Found ${allPortsData.count} total ports`);
      console.log('Sample ports:', allPortsData.ports.slice(0, 5));
    } else {
      console.log('❌ Failed to get all ports');
    }

    // Test 2: Get ports by country
    console.log('\n2. Getting ports for France...');
    const francePortsResponse = await fetch(`${BASE_URL}/all-ports?country=France`);
    const francePortsData = await francePortsResponse.json();
    
    if (francePortsData.success) {
      console.log(`✅ Found ${francePortsData.count} ports in France`);
      console.log('French ports:', francePortsData.ports);
    } else {
      console.log('❌ Failed to get French ports');
    }

    // Test 3: Get ports by country and city
    console.log('\n3. Getting ports for Monaco, Monte Carlo...');
    const monacoPortsResponse = await fetch(`${BASE_URL}/all-ports?country=Monaco&city=Monte Carlo`);
    const monacoPortsData = await monacoPortsResponse.json();
    
    if (monacoPortsData.success) {
      console.log(`✅ Found ${monacoPortsData.count} ports in Monte Carlo, Monaco`);
      console.log('Monaco ports:', monacoPortsData.ports);
    } else {
      console.log('❌ Failed to get Monaco ports');
    }

    // Test 4: Get ports by city only
    console.log('\n4. Getting ports for Miami...');
    const miamiPortsResponse = await fetch(`${BASE_URL}/all-ports?city=Miami`);
    const miamiPortsData = await miamiPortsResponse.json();
    
    if (miamiPortsData.success) {
      console.log(`✅ Found ${miamiPortsData.count} ports in Miami`);
      console.log('Miami ports:', miamiPortsData.ports);
    } else {
      console.log('❌ Failed to get Miami ports');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\nUsage examples:');
    console.log('- GET /api/v1/locations/all-ports (all ports)');
    console.log('- GET /api/v1/locations/all-ports?country=France (ports in France)');
    console.log('- GET /api/v1/locations/all-ports?city=Miami (ports in Miami)');
    console.log('- GET /api/v1/locations/all-ports?country=Monaco&city=Monte Carlo (specific city)');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\nMake sure your server is running on http://localhost:3000');
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testAllPortsAPI();
}

export { testAllPortsAPI };
