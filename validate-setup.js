// Smart Review SaaS - Setup Validation Script
// Run this in your browser console to verify everything is working

const validateSetup = async () => {
  console.log('🔍 SMART REVIEW SAAS - SETUP VALIDATION');
  console.log('=====================================');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const test = (name, condition, message) => {
    const passed = condition;
    results.tests.push({ name, passed, message });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  };
  
  // Test 1: Environment Variables
  const hasSupabaseUrl = window.location.origin.includes('localhost') || 
                         import.meta?.env?.VITE_SUPABASE_URL;
  test('Environment', hasSupabaseUrl, 
       hasSupabaseUrl ? 'Environment variables appear to be configured' : 'Missing environment variables');
  
  // Test 2: DOM Elements
  const hasButtons = document.querySelectorAll('button').length > 0;
  test('UI Elements', hasButtons, 
       hasButtons ? `Found ${document.querySelectorAll('button').length} buttons` : 'No buttons found');
  
  // Test 3: React Components
  const hasReactRoot = document.querySelector('#root') !== null;
  test('React App', hasReactRoot, 
       hasReactRoot ? 'React root element found' : 'React root element missing');
  
  // Test 4: Navigation
  const hasNavigation = document.querySelector('nav') !== null;
  test('Navigation', hasNavigation, 
       hasNavigation ? 'Navigation component found' : 'Navigation component missing');
  
  // Test 5: Authentication Elements
  const hasAuthButtons = document.querySelector('button') && 
                        (document.body.textContent.includes('Sign') || 
                         document.body.textContent.includes('Login'));
  test('Authentication', hasAuthButtons, 
       hasAuthButtons ? 'Authentication elements found' : 'Authentication elements missing');
  
  // Test 6: Dashboard Elements
  const hasDashboard = document.body.textContent.includes('Dashboard') || 
                      document.body.textContent.includes('Widget');
  test('Dashboard', hasDashboard, 
       hasDashboard ? 'Dashboard elements found' : 'Dashboard elements missing');
  
  // Test 7: Settings Buttons
  const hasSettingsButtons = Array.from(document.querySelectorAll('button')).some(btn => 
    btn.innerHTML.includes('Settings') || btn.innerHTML.includes('settings'));
  test('Settings Buttons', hasSettingsButtons, 
       hasSettingsButtons ? 'Settings buttons found' : 'Settings buttons missing');
  
  // Test 8: Click Handlers
  const buttonsWithHandlers = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.onclick || btn.hasAttribute('onclick') || btn.getAttribute('type') === 'submit');
  test('Button Functionality', buttonsWithHandlers.length > 0, 
       `${buttonsWithHandlers.length} buttons have click handlers`);
  
  // Test 9: Form Elements
  const hasForms = document.querySelectorAll('form').length > 0 || 
                  document.querySelectorAll('input').length > 0;
  test('Forms', hasForms, 
       hasForms ? 'Form elements found' : 'Form elements missing');
  
  // Test 10: PayPal Integration
  const hasPayPalElements = document.body.textContent.includes('PayPal') || 
                           document.body.textContent.includes('Subscribe');
  test('PayPal Integration', hasPayPalElements, 
       hasPayPalElements ? 'PayPal elements found' : 'PayPal elements missing');
  
  // Summary
  console.log('\n📊 VALIDATION SUMMARY:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Your Smart Review SaaS is ready!');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
  
  return results;
};

// Auto-run validation
const results = validateSetup();

// Test specific functionality
const testButtonFunctionality = () => {
  console.log('\n🔘 TESTING BUTTON FUNCTIONALITY:');
  
  const buttons = document.querySelectorAll('button');
  buttons.forEach((btn, i) => {
    const hasOnClick = btn.onclick || btn.hasAttribute('onclick') || btn.type === 'submit';
    const text = btn.textContent.trim();
    console.log(`Button ${i+1}: "${text}" - ${hasOnClick ? '✅ Functional' : '❌ Non-functional'}`);
  });
};

// Test PayPal integration
const testPayPalIntegration = () => {
  console.log('\n💰 TESTING PAYPAL INTEGRATION:');
  
  // Check for PayPal script
  const paypalScript = document.querySelector('script[src*="paypal"]');
  console.log('PayPal SDK:', paypalScript ? '✅ Loaded' : '❌ Not loaded');
  
  // Check for subscribe buttons
  const subscribeButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('Subscribe') || btn.textContent.includes('Pay'));
  console.log(`Subscribe buttons: ${subscribeButtons.length} found`);
  
  // Test debug function
  if (window.location.pathname.includes('billing')) {
    console.log('On billing page - PayPal integration should be active');
  }
};

// Test widget functionality
const testWidgetFunctionality = () => {
  console.log('\n🔧 TESTING WIDGET FUNCTIONALITY:');
  
  // Check for widget-related elements
  const widgetElements = document.querySelectorAll('[class*="widget"], [id*="widget"]');
  console.log(`Widget elements: ${widgetElements.length} found`);
  
  // Check for settings buttons
  const settingsButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.innerHTML.includes('Settings') || btn.innerHTML.includes('settings'));
  console.log(`Settings buttons: ${settingsButtons.length} found`);
  
  // Check for copy buttons
  const copyButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('Copy') || btn.innerHTML.includes('Copy'));
  console.log(`Copy buttons: ${copyButtons.length} found`);
};

// Run additional tests
testButtonFunctionality();
testPayPalIntegration();
testWidgetFunctionality();

// Export for manual testing
window.validateSetup = validateSetup;
window.testButtonFunctionality = testButtonFunctionality;
window.testPayPalIntegration = testPayPalIntegration;
window.testWidgetFunctionality = testWidgetFunctionality;

console.log('\n🛠️  MANUAL TESTING FUNCTIONS AVAILABLE:');
console.log('- validateSetup()');
console.log('- testButtonFunctionality()');
console.log('- testPayPalIntegration()');
console.log('- testWidgetFunctionality()');

export default validateSetup;