const { google } = require("googleapis");
require("dotenv").config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob"; // For desktop apps

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("Authorize this app by visiting this URL:");
console.log(authUrl);

// After authorizing, you'll get a code. Use it below:
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Enter the code from the authorization page: ", (code) => {
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error("Error retrieving tokens:", err);
      return;
    }
    console.log("Tokens:", tokens);
    console.log("Your Refresh Token:", tokens.refresh_token);
    readline.close();
  });
});