const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up Credit Scribe Hub Server...\n');

// Check if config.env exists
const configPath = path.join(__dirname, 'config.env');

if (fs.existsSync(configPath)) {
  console.log('✅ config.env already exists');
} else {
  console.log('📝 Creating config.env file...');
  
  const configContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/credit-scribe-hub
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
`;

  fs.writeFileSync(configPath, configContent);
  console.log('✅ config.env created successfully');
}

// Check if MongoDB is mentioned
console.log('\n📋 Setup Checklist:');
console.log('1. ✅ config.env file created');
console.log('2. ⚠️  Make sure MongoDB is running on your system');
console.log('3. ⚠️  Install MongoDB if not already installed');
console.log('4. ⚠️  Start MongoDB service');

console.log('\n🔧 To start the server:');
console.log('   npm run dev');

console.log('\n🧪 To test the endpoints:');
console.log('   node test-endpoints.js');

console.log('\n📚 For more information, see README.md');

console.log('\n🎉 Setup complete!');
