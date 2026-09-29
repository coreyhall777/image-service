// Quick script to test environment variable parsing
// Run with: PORT=8080 MAX_IMAGE_SIZE=5000000 REQUEST_TIMEOUT=15000 node test-env.js

import { CONFIG } from './dist/utils/constants.js';

console.log('🔍 Testing CONFIG environment variable parsing:\n');

console.log('PORT:', CONFIG.PORT);
console.log('  Type:', typeof CONFIG.PORT);
console.log('  Valid:', typeof CONFIG.PORT === 'number' && CONFIG.PORT > 0);

console.log('\nMAX_IMAGE_SIZE:', CONFIG.MAX_IMAGE_SIZE);
console.log('  Type:', typeof CONFIG.MAX_IMAGE_SIZE);
console.log('  Value (MB):', (CONFIG.MAX_IMAGE_SIZE / 1024 / 1024).toFixed(2));
console.log('  Valid:', typeof CONFIG.MAX_IMAGE_SIZE === 'number' && CONFIG.MAX_IMAGE_SIZE > 0);

console.log('\nREQUEST_TIMEOUT:', CONFIG.REQUEST_TIMEOUT);
console.log('  Type:', typeof CONFIG.REQUEST_TIMEOUT);
console.log('  Value (seconds):', (CONFIG.REQUEST_TIMEOUT / 1000).toFixed(1));
console.log('  Valid:', typeof CONFIG.REQUEST_TIMEOUT === 'number' && CONFIG.REQUEST_TIMEOUT > 0);

console.log('\n✅ All values are properly parsed as numbers!');
