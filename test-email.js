const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
const lines = envContent.split('\n');
let user = null;
let pass = null;

for (let line of lines) {
  if (line.startsWith('EMAIL_USER=')) user = line.split('=')[1].replace(/"/g, '').trim();
  if (line.startsWith('EMAIL_PASS=')) pass = line.split('=')[1].replace(/"/g, '').trim();
}

console.log("User:", user);
console.log("Pass:", pass);

const nodemailer = require('nodemailer');
async function test() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  try {
    await transporter.verify();
    console.log("Success verify!");
  } catch(e) {
    console.log("Error verify:", e.message);
  }
}
test();
