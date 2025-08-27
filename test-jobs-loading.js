// Test script to check jobs loading
import fetch from 'node-fetch';

async function testJobsAPI() {
  try {
    console.log('Testing jobs API...');
    
    // Test the posted jobs endpoint
    const response = await fetch('http://localhost:8080/api/v1/jobs/posted', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Jobs data:', data);
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testJobsAPI();
