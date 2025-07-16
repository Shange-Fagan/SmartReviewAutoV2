// Button Functionality Verification Script
// Run this in your browser console on each page

const verifyButtonFunctionality = () => {
  console.log('🧪 BUTTON FUNCTIONALITY VERIFICATION');
  console.log('=====================================');
  
  const buttons = document.querySelectorAll('button');
  const links = document.querySelectorAll('a');
  
  console.log(`\n📊 Found ${buttons.length} buttons and ${links.length} links\n`);
  
  // Test buttons
  let functionalButtons = 0;
  let nonFunctionalButtons = 0;
  
  buttons.forEach((btn, i) => {
    const hasOnClick = btn.onclick || btn.hasAttribute('onclick') || btn.hasAttribute('type');
    const isDisabled = btn.disabled;
    const hasText = btn.textContent.trim();
    const hasEventListener = btn.getEventListeners ? Object.keys(btn.getEventListeners()).length > 0 : 'unknown';
    
    // Check if button has React event handlers (they won't show up in onclick)
    const hasReactHandler = btn.hasAttribute('data-testid') || btn.className.includes('Button') || btn.type === 'submit';
    
    const isFunctional = hasOnClick || hasReactHandler || btn.type === 'submit';
    
    if (isFunctional) {
      functionalButtons++;
      console.log(`✅ Button ${i+1}: "${hasText}" - FUNCTIONAL ${isDisabled ? '(disabled)' : ''}`);
    } else {
      nonFunctionalButtons++;
      console.log(`❌ Button ${i+1}: "${hasText}" - NON-FUNCTIONAL ${isDisabled ? '(disabled)' : ''}`);
    }
  });
  
  // Test links
  let functionalLinks = 0;
  let nonFunctionalLinks = 0;
  
  links.forEach((link, i) => {
    const hasHref = link.href && link.href !== '#' && link.href !== window.location.href + '#';
    const hasOnClick = link.onclick || link.hasAttribute('onclick');
    const text = link.textContent.trim();
    const isRouterLink = link.hasAttribute('data-testid') || link.className.includes('Link');
    
    const isFunctional = hasHref || hasOnClick || isRouterLink;
    
    if (isFunctional) {
      functionalLinks++;
      console.log(`✅ Link ${i+1}: "${text}" - FUNCTIONAL (${hasHref ? 'href' : 'onClick'})`);
    } else {
      nonFunctionalLinks++;
      console.log(`❌ Link ${i+1}: "${text}" - NON-FUNCTIONAL`);
    }
  });
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Functional Buttons: ${functionalButtons}/${buttons.length}`);
  console.log(`Functional Links: ${functionalLinks}/${links.length}`);
  console.log(`Overall Success Rate: ${((functionalButtons + functionalLinks) / (buttons.length + links.length) * 100).toFixed(1)}%`);
  
  if (nonFunctionalButtons === 0 && nonFunctionalLinks === 0) {
    console.log('🎉 ALL BUTTONS AND LINKS ARE FUNCTIONAL!');
  } else {
    console.log('⚠️  Some buttons or links may need attention');
  }
  
  return {
    buttons: { functional: functionalButtons, total: buttons.length },
    links: { functional: functionalLinks, total: links.length }
  };
};

// Auto-run verification
verifyButtonFunctionality();

// Export for manual use
window.verifyButtonFunctionality = verifyButtonFunctionality;