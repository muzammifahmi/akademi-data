const mongoose = require('mongoose');
const uri = "mongodb+srv://achmadmuzammi2305336_db_user:i7IqngJakm9S75LK@sqlearn.959xljr.mongodb.net/";

mongoose.connect(uri).then(() => {
  console.log("Connected successfully");
  process.exit(0);
}).catch(err => {
  console.error("Connection error:", err);
  process.exit(1);
});
