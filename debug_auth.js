// Debug Authentication State
// Run this in your browser console to check authentication

console.log('🔍 Debugging Authentication State...');

// Check localStorage
console.log('\n📦 localStorage contents:');
const authStorage = localStorage.getItem('auth-storage');
if (authStorage) {
  try {
    const parsed = JSON.parse(authStorage);
    console.log('✅ auth-storage found:', parsed);
    
    if (parsed.state) {
      console.log('   User:', parsed.state.user);
      console.log('   Token:', parsed.state.token ? 'Present' : 'Missing');
      console.log('   Is Authenticated:', parsed.state.isAuthenticated);
    } else {
      console.log('   No state object found');
    }
  } catch (e) {
    console.log('❌ Error parsing auth-storage:', e);
  }
} else {
  console.log('❌ No auth-storage found');
}

// Check sessionStorage
console.log('\n📦 sessionStorage contents:');
const sessionAuth = sessionStorage.getItem('auth-storage');
if (sessionAuth) {
  console.log('✅ session auth-storage found:', sessionAuth);
} else {
  console.log('❌ No session auth-storage found');
}

// Check if user is logged in
console.log('\n👤 Current User State:');
if (typeof window !== 'undefined' && window.useAuth) {
  console.log('✅ useAuth hook available');
} else {
  console.log('❌ useAuth hook not available');
}

// Check API calls
console.log('\n🌐 API Configuration:');
console.log('   API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
console.log('   Current URL:', window.location.href);

console.log('\n🎯 Next Steps:');
console.log('   1. Check if you are logged in');
console.log('   2. Verify the token is present');
console.log('   3. Check if the API endpoint is correct');
console.log('   4. Verify CORS settings');
