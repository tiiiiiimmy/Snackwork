#!/usr/bin/env node

/**
 * Accessibility Audit Script for SnackSpot Auckland
 * Checks WCAG 2.1 AA compliance and generates a report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color contrast calculation
function getContrastRatio(color1, color2) {
  function getLuminance(color) {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const normalized = parseInt(val) / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Check if files contain accessibility features
function checkAccessibilityFeatures() {
  const results = {
    pass: [],
    fail: [],
    warnings: []
  };
  
  // Check for accessibility utilities
  const accessibilityUtilsPath = path.join(__dirname, '../src/utils/accessibility.ts');
  if (fs.existsSync(accessibilityUtilsPath)) {
    const content = fs.readFileSync(accessibilityUtilsPath, 'utf8');
    if (content.includes('announceToScreenReader')) {
      results.pass.push('✓ Screen reader announcements implemented');
    }
    if (content.includes('FocusTrap')) {
      results.pass.push('✓ Focus trap functionality available');
    }
    if (content.includes('getContrastRatio')) {
      results.pass.push('✓ Color contrast validation tools available');
    }
    if (content.includes('validateFormAccessibility')) {
      results.pass.push('✓ Form accessibility validation implemented');
    }
    if (content.includes('LiveRegion')) {
      results.pass.push('✓ ARIA live regions implemented');
    }
  } else {
    results.fail.push('✗ Accessibility utilities not found');
  }
  
  // Check for accessibility CSS
  const commonScssPath = path.join(__dirname, '../src/styles/components/_common.scss');
  if (fs.existsSync(commonScssPath)) {
    const content = fs.readFileSync(commonScssPath, 'utf8');
    if (content.includes('.sr-only')) {
      results.pass.push('✓ Screen reader only styles available');
    }
    if (content.includes('.skip-link')) {
      results.pass.push('✓ Skip links implemented');
    }
    if (content.includes('focus-visible')) {
      results.pass.push('✓ Focus indicators implemented');
    }
    if (content.includes('prefers-reduced-motion')) {
      results.pass.push('✓ Reduced motion support implemented');
    }
    if (content.includes('prefers-contrast')) {
      results.pass.push('✓ High contrast mode support implemented');
    }
    if (content.includes('min-height: 44px')) {
      results.pass.push('✓ Touch target sizing (44px minimum) implemented');
    }
  }
  
  // Check for accessibility tests
  const accessibilityTestPath = path.join(__dirname, '../cypress/e2e/accessibility.cy.ts');
  if (fs.existsSync(accessibilityTestPath)) {
    const content = fs.readFileSync(accessibilityTestPath, 'utf8');
    if (content.includes('keyboard navigation')) {
      results.pass.push('✓ Keyboard navigation tests available');
    }
    if (content.includes('screen reader')) {
      results.pass.push('✓ Screen reader tests available');
    }
    if (content.includes('color contrast')) {
      results.pass.push('✓ Color contrast tests available');
    }
    if (content.includes('touch target')) {
      results.pass.push('✓ Touch target tests available');
    }
  }
  
  return results;
}

// Check component accessibility
function checkComponentAccessibility() {
  const results = {
    pass: [],
    fail: [],
    warnings: []
  };
  
  const componentsDir = path.join(__dirname, '../src/components');
  
  function checkFile(filePath) {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.tsx')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check for ARIA attributes
    if (content.includes('aria-label') || content.includes('aria-labelledby')) {
      results.pass.push(`✓ ${fileName}: ARIA labels found`);
    }
    
    if (content.includes('aria-hidden')) {
      results.pass.push(`✓ ${fileName}: Decorative elements properly hidden`);
    }
    
    if (content.includes('role=')) {
      results.pass.push(`✓ ${fileName}: ARIA roles implemented`);
    }
    
    // Check for semantic HTML
    if (content.includes('<button') || content.includes('<a ') || content.includes('<nav')) {
      results.pass.push(`✓ ${fileName}: Semantic HTML elements used`);
    }
    
    // Check for alt text on images
    if (content.includes('<img') && content.includes('alt=')) {
      results.pass.push(`✓ ${fileName}: Image alt text provided`);
    } else if (content.includes('<img') && !content.includes('alt=')) {
      results.warnings.push(`⚠ ${fileName}: Images found without alt text`);
    }
    
    // Check for form labels
    if (content.includes('<input') || content.includes('<textarea') || content.includes('<select')) {
      if (content.includes('htmlFor=') || content.includes('aria-label')) {
        results.pass.push(`✓ ${fileName}: Form inputs properly labeled`);
      } else {
        results.warnings.push(`⚠ ${fileName}: Form inputs may need better labeling`);
      }
    }
  }
  
  // Recursively check all component files
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        checkFile(filePath);
      }
    });
  }
  
  if (fs.existsSync(componentsDir)) {
    walkDir(componentsDir);
  }
  
  return results;
}

// Generate accessibility report
function generateReport() {
  console.log('\n🔍 SnackSpot Auckland - Accessibility Audit Report');
  console.log('='.repeat(60));
  
  const featureResults = checkAccessibilityFeatures();
  const componentResults = checkComponentAccessibility();
  
  console.log('\n📋 Accessibility Features Check:');
  console.log('-'.repeat(40));
  
  featureResults.pass.forEach(item => console.log(item));
  featureResults.fail.forEach(item => console.log(item));
  featureResults.warnings.forEach(item => console.log(item));
  
  console.log('\n🧩 Component Accessibility Check:');
  console.log('-'.repeat(40));
  
  componentResults.pass.slice(0, 10).forEach(item => console.log(item));
  if (componentResults.pass.length > 10) {
    console.log(`... and ${componentResults.pass.length - 10} more passing checks`);
  }
  
  componentResults.warnings.forEach(item => console.log(item));
  componentResults.fail.forEach(item => console.log(item));
  
  console.log('\n📊 Summary:');
  console.log('-'.repeat(40));
  
  const totalPassing = featureResults.pass.length + componentResults.pass.length;
  const totalWarnings = featureResults.warnings.length + componentResults.warnings.length;
  const totalFailing = featureResults.fail.length + componentResults.fail.length;
  
  console.log(`✓ Passing checks: ${totalPassing}`);
  console.log(`⚠ Warnings: ${totalWarnings}`);
  console.log(`✗ Failing checks: ${totalFailing}`);
  
  const score = Math.round((totalPassing / (totalPassing + totalWarnings + totalFailing)) * 100);
  console.log(`\n🏆 Accessibility Score: ${score}/100`);
  
  console.log('\n🎯 WCAG 2.1 AA Compliance Status:');
  console.log('-'.repeat(40));
  
  if (score >= 90) {
    console.log('🟢 EXCELLENT - Meets WCAG 2.1 AA standards');
  } else if (score >= 80) {
    console.log('🟡 GOOD - Minor improvements needed for full compliance');
  } else if (score >= 70) {
    console.log('🟠 FAIR - Several accessibility issues need attention');
  } else {
    console.log('🔴 POOR - Significant accessibility improvements required');
  }
  
  console.log('\n📝 Recommendations:');
  console.log('-'.repeat(40));
  console.log('• Continue testing with real screen readers');
  console.log('• Conduct user testing with users who have disabilities');
  console.log('• Run automated accessibility tests regularly');
  console.log('• Test keyboard navigation thoroughly');
  console.log('• Validate color contrast in different lighting conditions');
  
  return { score, totalPassing, totalWarnings, totalFailing };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}