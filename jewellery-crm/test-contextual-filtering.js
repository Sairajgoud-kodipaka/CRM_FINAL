// Test Contextual Catchment Area Filtering
const { getCatchmentAreasForCity, getStateFromCity, getPincodeFromCatchment } = require('./src/constants/indian-data.ts');

function testContextualFiltering() {
  console.log('🧪 Testing Contextual Catchment Area Filtering...\n');
  
  // Test 1: City to State mapping
  console.log('1️⃣ Testing City → State mapping:');
  const cities = ['Hyderabad', 'Ahmedabad', 'Mumbai'];
  
  cities.forEach(city => {
    const state = getStateFromCity(city);
    console.log(`   ${city} → ${state || 'No mapping'}`);
  });
  
  // Test 2: City to Catchment Areas mapping
  console.log('\n2️⃣ Testing City → Catchment Areas mapping:');
  cities.forEach(city => {
    const catchmentAreas = getCatchmentAreasForCity(city);
    console.log(`   ${city} → ${catchmentAreas.length} areas: ${catchmentAreas.slice(0, 3).join(', ')}${catchmentAreas.length > 3 ? '...' : ''}`);
  });
  
  // Test 3: Catchment Area to Pincode mapping
  console.log('\n3️⃣ Testing Catchment Area → Pincode mapping:');
  const testAreas = ['Banjara Hills', 'Manek Chowk', 'Zaveri Bazaar'];
  
  testAreas.forEach(area => {
    const pincode = getPincodeFromCatchment(area);
    console.log(`   ${area} → ${pincode || 'No mapping'}`);
  });
  
  // Test 4: Complete flow simulation
  console.log('\n4️⃣ Testing Complete Flow (City → State → Catchment → Pincode):');
  const testCity = 'Hyderabad';
  const testCatchment = 'Banjara Hills';
  
  const state = getStateFromCity(testCity);
  const catchmentAreas = getCatchmentAreasForCity(testCity);
  const pincode = getPincodeFromCatchment(testCatchment);
  
  console.log(`   City: ${testCity}`);
  console.log(`   State: ${state}`);
  console.log(`   Available Catchment Areas: ${catchmentAreas.length}`);
  console.log(`   Selected Catchment: ${testCatchment}`);
  console.log(`   Pincode: ${pincode}`);
  
  // Test 5: Validation
  console.log('\n5️⃣ Testing Validation:');
  const isValidCity = state !== null;
  const isValidCatchment = catchmentAreas.includes(testCatchment);
  const isValidPincode = pincode !== null;
  
  console.log(`   City valid: ${isValidCity ? '✅' : '❌'}`);
  console.log(`   Catchment valid: ${isValidCatchment ? '✅' : '❌'}`);
  console.log(`   Pincode valid: ${isValidPincode ? '✅' : '❌'}`);
  
  if (isValidCity && isValidCatchment && isValidPincode) {
    console.log('\n🎉 All tests passed! Contextual filtering is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the data mappings.');
  }
}

// Run the test
testContextualFiltering();
