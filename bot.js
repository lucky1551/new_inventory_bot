
// const { Client, LocalAuth } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");
// const xlsx = require("xlsx");
// const fs = require("fs");
// const { google } = require("googleapis");
// require("dotenv").config();

// // Constants
// const FILE_PATH = "./Inventory_Register.xlsx";
// const SHEET_NAME_DEFAULT = "Sheet1";
// const SERIAL_NUMBER_FIELD = "S.No"; // The field name for the serial number in the Excel file
// const REQUIRED_FIELDS = ["Material Code", "Item Description"]; // Required fields for adding a new item
// const MESSAGES = {
//   WELCOME: "👋 Hi! Please choose an option:\n1. See/Update details of existing data\n2. Add a new item\n3. List all items\n4. Delete an item\nType 'help' for more commands.",
//   SEARCH_PROMPT: "🔍 Please enter a 🔢 Material Code or 🏷️ Item Description to check details (or type 'cancel' to go back):",
//   DELETE_PROMPT: "🔍 Please enter a 🔢 Material Code or 🏷️ Item Description to delete (or type 'cancel' to go back):",
//   ADD_PROMPT: (field) => `✏️ Enter ${field} (or type 'cancel' to go back):`,
//   ADD_CONFIRM: "✅ Material Code and Item Description added. Type 'done' to finish (remaining fields will be set to N/A) or 'continue' to add more details:",
//   UPDATE_PROMPT: (fields) => `🛠️ Which field would you like to update?\nAvailable fields:\n${fields}\n(or type 'cancel' to go back)`,
//   UPDATE_VALUE_PROMPT: (field) => `✏️ Enter the new value for ${field} (or type 'cancel' to go back):`,
//   SELECT_ITEM_PROMPT: (items) => `🔍 Multiple items found. Please select one:\n${items}\nReply with the number of the item (or type 'cancel' to go back).`,
//   ITEM_DETAILS: (item) => {
//     let reply = "📋 *Item Details:*\n";
//     for (const key in item) {
//       reply += `📌 *${key}:* ${item[key]}\n`;
//     }
//     return reply + "\n❓ Do you want to update any information? (yes/no)";
//   },
//   SUCCESS_ADD: "✅ New item added and Excel file updated on Google Drive!",
//   SUCCESS_DELETE: "✅ Item deleted successfully and Excel file updated on Google Drive!",
//   SUCCESS_UPDATE: (field, value) => `✅ ${field} updated successfully! New value: ${value}`,
//   UPDATE_CONFIRM: "⚙️ Do you want to update anything else? (yes/no)",
//   ERROR: "⚠️ An error occurred. Please try again or type 'hi' to restart.",
//   INVALID_INPUT: "❌ Invalid input. Please try again.",
//   NO_ITEMS_FOUND: "❌ No matching Material Code or Item Description found. Please try again.",
//   INVALID_SELECTION: "⚠️ Invalid selection. Please try again.",
//   CANCEL: "👍 Operation cancelled. Type 'hi' to start again.",
//   HELP: "📖 Available commands:\n- 'hi': Start the bot\n- 'help': Show this message\n- 'cancel': Cancel the current operation\nChoose an option:\n1. See/Update details\n2. Add a new item\n3. List all items\n4. Delete an item",
//   LOADING: "⏳ Loading data, please wait...",
//   LIST_ITEMS: (items) => `📋 *All Items:*\n${items}\nType 'hi' to go back to the main menu.`,
//   MISSING_REQUIRED_FIELDS: "❌ Both Material Code and Item Description are required. Item not added. Type 'hi' to start again.",
//   INVALID_MIN_LEVEL: (maxLevel) => `❌ Invalid input. Min Level must be less than or equal to Max Level (${maxLevel}). Please enter a valid value.`,
//   INVALID_MAX_LEVEL: (minLevel) => `❌ Invalid input. Max Level must be greater than or equal to Min Level (${minLevel}). Please enter a valid value.`,
//   INVALID_NUMERIC: "❌ Min Level and Max Level must be numeric values. Please enter a valid number.",
//   DUPLICATE_MATERIAL_CODE_PROMPT: (item) =>
//     `⚠️ The Material Code already exists:\n${item["S.No"]} - ${item["Material Code"]} - ${item["Item Description"]}\nWould you like to update this item? (yes/no)`,
// };

// // Google Drive Configuration
// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   "urn:ietf:wg:oauth:2.0:oob"
// );
// oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
// const drive = google.drive({ version: "v3", auth: oauth2Client });

// // State Management
// const BotState = {
//   IDLE: "IDLE",
//   INITIAL_MENU: "INITIAL_MENU",
//   SEARCHING: "SEARCHING",
//   SELECTING_ITEM: "SELECTING_ITEM",
//   UPDATING: "UPDATING",
//   UPDATING_VALUE: "UPDATING_VALUE",
//   ADDING_ITEM: "ADDING_ITEM",
//   ADDING_CONFIRM: "ADDING_CONFIRM",
//   LISTING_ITEMS: "LISTING_ITEMS",
//   DELETING_ITEM: "DELETING_ITEM",
//   SELECTING_ITEM_TO_DELETE: "SELECTING_ITEM_TO_DELETE",
//   HANDLING_DUPLICATE: "HANDLING_DUPLICATE", // New state for handling duplicate Material Codes
// };

// // Class to manage bot state and data
// class InventoryBot {
//   constructor() {
//     this.state = BotState.IDLE;
//     this.data = [];
//     this.workbook = null;
//     this.sheetName = null;
//     this.worksheet = null;
//     this.headerRow = null;
//     this.currentItem = null;
//     this.foundItems = [];
//     this.newItem = {};
//     this.currentFieldIndex = 0;
//     this.fieldsToAdd = [];
//     this.requiredFieldsEntered = 0;
//     this.updateField = null;
//     this.client = new Client({
//       authStrategy: new LocalAuth(),
//       puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
//     });

//     // Bind methods
//     this.handleMessage = this.handleMessage.bind(this);
//     this.downloadFileFromGoogleDrive = this.downloadFileFromGoogleDrive.bind(this);
//     this.uploadFileToGoogleDrive = this.uploadFileToGoogleDrive.bind(this);
//     this.loadExcelFile = this.loadExcelFile.bind(this);
//     this.updateExcelFile = this.updateExcelFile.bind(this);
//     this.listFiles = this.listFiles.bind(this);
//     this.generateSerialNumber = this.generateSerialNumber.bind(this);

//     // Initialize WhatsApp client
//     this.client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
//     this.client.on("ready", () => console.log("✅ Client is ready!"));
//     this.client.on("message", this.handleMessage);
//     this.client.initialize();
//   }

//   // Generate the next serial number
//   generateSerialNumber() {
//     if (this.data.length === 0) {
//       return 1; // If the Excel file is empty, start with S.No 1
//     }
//     const serialNumbers = this.data
//       .map((item) => parseInt(item[SERIAL_NUMBER_FIELD], 10))
//       .filter((num) => !isNaN(num));
//     const maxSerialNumber = Math.max(...serialNumbers, 0);
//     return maxSerialNumber + 1;
//   }

//   // Google Drive: Download file with retry mechanism
//   async downloadFileFromGoogleDrive() {
//     const maxRetries = 3;
//     let attempt = 1;
//     while (attempt <= maxRetries) {
//       try {
//         console.log(`[DEBUG] Attempt ${attempt} to download file from Google Drive...`);
//         const response = await drive.files.get(
//           { fileId: process.env.GOOGLE_DRIVE_FILE_ID, alt: "media" },
//           { responseType: "stream" }
//         );
//         const writer = fs.createWriteStream(FILE_PATH);
//         response.data.pipe(writer);
//         return new Promise((resolve, reject) => {
//           writer.on("finish", () => {
//             console.log("File downloaded from Google Drive.");
//             resolve();
//           });
//           writer.on("error", (err) => {
//             console.error("Error downloading file:", err.message);
//             reject(err);
//           });
//         });
//       } catch (error) {
//         console.error(`Error downloading file from Google Drive (attempt ${attempt}):`, error.message);
//         if (attempt === maxRetries) throw error;
//         attempt++;
//         await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
//       }
//     }
//   }

//   // Google Drive: Upload file
//   async uploadFileToGoogleDrive() {
//     try {
//       const fileContent = fs.createReadStream(FILE_PATH);
//       await drive.files.update({
//         fileId: process.env.GOOGLE_DRIVE_FILE_ID,
//         media: {
//           mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//           body: fileContent,
//         },
//       });
//       console.log("File uploaded to Google Drive.");
//     } catch (error) {
//       console.error("Error uploading file to Google Drive:", error.message);
//       throw error;
//     }
//   }

//   // Google Drive: List files (for debugging)
//   async listFiles() {
//     try {
//       const response = await drive.files.list({
//         q: "name='a_data.xlsx'",
//         fields: "files(id, name, permissions, parents)",
//         spaces: "drive",
//         corpora: "user",
//         includeItemsFromAllDrives: true,
//         supportsAllDrives: true,
//       });
//       console.log("Files found:", response.data.files);
//       if (response.data.files.length === 0) {
//         console.log("No files found with name 'a_data.xlsx'. Checking case-insensitive...");
//         const responseCaseInsensitive = await drive.files.list({
//           q: "name contains 'a_data.xlsx'",
//           fields: "files(id, name, permissions, parents)",
//           spaces: "drive",
//           corpora: "user",
//           includeItemsFromAllDrives: true,
//           supportsAllDrives: true,
//         });
//         console.log("Files found (case-insensitive):", responseCaseInsensitive.data.files);
//       }
//     } catch (error) {
//       console.error("Error listing files:", error.response ? error.response.data : error.message);
//     }
//   }

//   // Excel: Load file
//   async loadExcelFile(message) {
//     try {
//       if (message) message.reply(MESSAGES.LOADING);
//       console.log("[DEBUG] Downloading file from Google Drive...");
//       // Force a fresh download by deleting the local file
//       if (fs.existsSync(FILE_PATH)) {
//         console.log("[DEBUG] Deleting existing local file to force fresh download...");
//         fs.unlinkSync(FILE_PATH);
//       }
//       await this.downloadFileFromGoogleDrive();

//       if (!fs.existsSync(FILE_PATH)) {
//         console.error("File not found locally. Creating an empty Excel file.");
//         this.workbook = xlsx.utils.book_new();
//         xlsx.utils.book_append_sheet(this.workbook, xlsx.utils.aoa_to_sheet([[]]), SHEET_NAME_DEFAULT);
//         xlsx.writeFile(this.workbook, FILE_PATH);
//       }

//       console.log("[DEBUG] Reading local Excel file...");
//       this.workbook = xlsx.readFile(FILE_PATH);
//       this.sheetName = this.workbook.SheetNames[0] || SHEET_NAME_DEFAULT;
//       console.log("[DEBUG] Using sheet:", this.sheetName);
//       this.worksheet = this.workbook.Sheets[this.sheetName];
//       this.headerRow = xlsx.utils.sheet_to_json(this.worksheet, { header: 1 })[0] || [];
//       console.log("[DEBUG] Header row:", this.headerRow);

//       this.data = xlsx.utils.sheet_to_json(this.worksheet);
//       this.data = this.data.map((entry) => {
//         let normalizedEntry = {};
//         this.headerRow.forEach((header) => {
//           const trimmedHeader = header?.toString().trim();
//           normalizedEntry[trimmedHeader] = entry[trimmedHeader] || "N/A";
//         });
//         return normalizedEntry;
//       });

//       console.log("📦 Loaded data from local file:", JSON.stringify(this.data, null, 2));
//     } catch (error) {
//       console.error("Error loading Excel file:", error.message);
//       throw error;
//     }
//   }

//   // Excel: Update file
//   async updateExcelFile() {
//     try {
//       const updatedWorksheet = xlsx.utils.json_to_sheet(this.data);
//       this.workbook.Sheets[this.sheetName] = updatedWorksheet;
//       xlsx.writeFile(this.workbook, FILE_PATH);
//       console.log("Excel file updated locally.");
//       await this.uploadFileToGoogleDrive();
//     } catch (error) {
//       console.error("Error updating Excel file:", error.message);
//       throw error;
//     }
//   }

//   // Fill remaining fields with "N/A"
//   fillRemainingFields() {
//     this.fieldsToAdd.forEach((field) => {
//       if (!(field in this.newItem)) {
//         this.newItem[field] = "N/A";
//       }
//     });
//   }

//   // Validate required fields
//   validateRequiredFields() {
//     return REQUIRED_FIELDS.every((field) => {
//       const value = this.newItem[field];
//       return value && value.trim() !== "" && value !== "N/A";
//     });
//   }

//   // Check if a value is defined (not "N/A" and not empty)
//   isDefined(value) {
//     return value && value !== "N/A" && value.toString().trim() !== "";
//   }

//   // WhatsApp: Handle messages
//   async handleMessage(message) {
//     try {
//       const userMessage = message.body.trim().toLowerCase();
//       console.log(`[DEBUG] Current state: ${this.state}, User message: ${userMessage}`);

//       // Handle "cancel" command
//       if (userMessage === "cancel" && this.state !== BotState.IDLE) {
//         console.log("[DEBUG] Cancel command received.");
//         // If required fields are entered, save the item before canceling
//         if (this.state === BotState.ADDING_ITEM || this.state === BotState.ADDING_CONFIRM) {
//           if (this.requiredFieldsEntered === REQUIRED_FIELDS.length && this.validateRequiredFields()) {
//             console.log("[DEBUG] Required fields entered, saving item before canceling.");
//             this.fillRemainingFields();
//             this.data.push(this.newItem);
//             await this.updateExcelFile();
//             message.reply(MESSAGES.SUCCESS_ADD);
//           } else {
//             console.log("[DEBUG] Required fields not fully entered, discarding item.");
//             message.reply(MESSAGES.CANCEL);
//           }
//         } else {
//           message.reply(MESSAGES.CANCEL);
//         }

//         // Reset state
//         this.state = BotState.IDLE;
//         this.currentItem = null;
//         this.foundItems = [];
//         this.newItem = {};
//         this.currentFieldIndex = 0;
//         this.requiredFieldsEntered = 0;
//         this.updateField = null;
//         return;
//       }

//       // Handle "help" command
//       if (userMessage === "help") {
//         console.log("[DEBUG] Help command received.");
//         message.reply(MESSAGES.HELP);
//         return;
//       }

//       // State machine
//       switch (this.state) {
//         case BotState.IDLE:
//           console.log("[DEBUG] In IDLE state.");
//           if (userMessage === "hi") {
//             await this.loadExcelFile(message);
//             if (this.data.length === 0) {
//               message.reply("⚠️ The Excel file is empty. Please add items using option 2.");
//               return;
//             }
//             // Exclude S.No and required fields from fieldsToAdd
//             this.fieldsToAdd = Object.keys(this.data[0] || {}).filter(
//               (field) =>
//                 field.toLowerCase() !== SERIAL_NUMBER_FIELD.toLowerCase() &&
//                 !REQUIRED_FIELDS.map(f => f.toLowerCase()).includes(field.toLowerCase())
//             );
//             message.reply(MESSAGES.WELCOME);
//             this.state = BotState.INITIAL_MENU;
//           }
//           break;

//         case BotState.INITIAL_MENU:
//           console.log("[DEBUG] In INITIAL_MENU state.");
//           if (userMessage === "1") {
//             this.state = BotState.SEARCHING;
//             message.reply(MESSAGES.SEARCH_PROMPT);
//           } else if (userMessage === "2") {
//             if (this.data.length === 0) {
//               message.reply("⚠️ The Excel file is empty. Please add at least one item first.");
//               return;
//             }
//             this.state = BotState.ADDING_ITEM;
//             this.currentFieldIndex = 0;
//             this.requiredFieldsEntered = 0;
//             this.newItem = {};
//             // Automatically generate S.No and add it to newItem
//             this.newItem[SERIAL_NUMBER_FIELD] = this.generateSerialNumber();
//             message.reply(MESSAGES.ADD_PROMPT(REQUIRED_FIELDS[this.currentFieldIndex]));
//           } else if (userMessage === "3") {
//             this.state = BotState.LISTING_ITEMS;
//             let itemsList = this.data.map((item, index) => `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`).join("\n");
//             message.reply(MESSAGES.LIST_ITEMS(itemsList));
//             this.state = BotState.IDLE;
//           } else if (userMessage === "4") {
//             this.state = BotState.DELETING_ITEM;
//             message.reply(MESSAGES.DELETE_PROMPT);
//           } else {
//             message.reply(MESSAGES.INVALID_INPUT);
//           }
//           break;

//         case BotState.SEARCHING:
//           console.log("[DEBUG] In SEARCHING state.");
//           const input = message.body.trim();
//           this.foundItems = this.data.filter(
//             (entry) =>
//               (entry["Material Code"] != null &&
//                 entry["Material Code"].toString().trim().toLowerCase().startsWith(input.toLowerCase())) ||
//               (typeof entry["Item Description"] === "string" &&
//                 entry["Item Description"].toLowerCase().includes(input.toLowerCase()))
//           );

//           if (this.foundItems.length === 1) {
//             this.currentItem = this.foundItems[0];
//             message.reply(MESSAGES.ITEM_DETAILS(this.currentItem));
//             this.state = BotState.UPDATING;
//           } else if (this.foundItems.length > 1) {
//             let itemsList = this.foundItems
//               .map((item, index) => `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`)
//               .join("\n");
//             message.reply(MESSAGES.SELECT_ITEM_PROMPT(itemsList));
//             this.state = BotState.SELECTING_ITEM;
//           } else {
//             message.reply(MESSAGES.NO_ITEMS_FOUND);
//           }
//           break;

//         case BotState.SELECTING_ITEM:
//           console.log("[DEBUG] In SELECTING_ITEM state.");
//           const selectedIndex = parseInt(userMessage) - 1;
//           if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < this.foundItems.length) {
//             this.currentItem = this.foundItems[selectedIndex];
//             message.reply(MESSAGES.ITEM_DETAILS(this.currentItem));
//             this.state = BotState.UPDATING;
//           } else {
//             message.reply(MESSAGES.INVALID_SELECTION);
//           }
//           break;

//         case BotState.DELETING_ITEM:
//           console.log("[DEBUG] In DELETING_ITEM state.");
//           const deleteInput = message.body.trim();
//           this.foundItems = this.data.filter(
//             (entry) =>
//               (entry["Material Code"] != null &&
//                 entry["Material Code"].toString().trim().toLowerCase().startsWith(deleteInput.toLowerCase())) ||
//               (typeof entry["Item Description"] === "string" &&
//                 entry["Item Description"].toLowerCase().includes(deleteInput.toLowerCase()))
//           );

//           if (this.foundItems.length === 1) {
//             this.currentItem = this.foundItems[0];
//             this.data = this.data.filter(
//               (entry) =>
//                 entry["Material Code"] !== this.currentItem["Material Code"] ||
//                 entry["Item Description"] !== this.currentItem["Item Description"]
//             );
//             await this.updateExcelFile();
//             message.reply(MESSAGES.SUCCESS_DELETE);
//             this.currentItem = null;
//             this.foundItems = [];
//             this.state = BotState.IDLE;
//           } else if (this.foundItems.length > 1) {
//             let itemsList = this.foundItems
//               .map((item, index) => `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`)
//               .join("\n");
//             message.reply(MESSAGES.SELECT_ITEM_PROMPT(itemsList));
//             this.state = BotState.SELECTING_ITEM_TO_DELETE;
//           } else {
//             message.reply(MESSAGES.NO_ITEMS_FOUND);
//             this.state = BotState.IDLE;
//           }
//           break;

//         case BotState.SELECTING_ITEM_TO_DELETE:
//           console.log("[DEBUG] In SELECTING_ITEM_TO_DELETE state.");
//           const deleteIndex = parseInt(userMessage) - 1;
//           if (!isNaN(deleteIndex) && deleteIndex >= 0 && deleteIndex < this.foundItems.length) {
//             this.currentItem = this.foundItems[deleteIndex];
//             this.data = this.data.filter(
//               (entry) =>
//                 entry["Material Code"] !== this.currentItem["Material Code"] ||
//                 entry["Item Description"] !== this.currentItem["Item Description"]
//             );
//             await this.updateExcelFile();
//             message.reply(MESSAGES.SUCCESS_DELETE);
//             this.currentItem = null;
//             this.foundItems = [];
//             this.state = BotState.IDLE;
//           } else {
//             message.reply(MESSAGES.INVALID_SELECTION);
//             this.state = BotState.IDLE;
//           }
//           break;

//         case BotState.UPDATING:
//           console.log("[DEBUG] In UPDATING state.");
//           if (userMessage === "yes") {
//             let availableFields = Object.keys(this.currentItem).map((field) => `📌 ${field}`).join("\n");
//             message.reply(MESSAGES.UPDATE_PROMPT(availableFields));
//           } else if (userMessage === "no") {
//             message.reply("👍 Thank you! Type 'hi' to start again.");
//             this.currentItem = null;
//             this.state = BotState.IDLE;
//           } else if (Object.keys(this.currentItem).map((key) => key.toLowerCase()).includes(userMessage)) {
//             this.updateField = Object.keys(this.currentItem).find((key) => key.toLowerCase() === userMessage);
//             this.state = BotState.UPDATING_VALUE;
//             message.reply(MESSAGES.UPDATE_VALUE_PROMPT(this.updateField));
//           } else {
//             message.reply(MESSAGES.INVALID_INPUT);
//           }
//           break;

//         case BotState.UPDATING_VALUE:
//           console.log("[DEBUG] In UPDATING_VALUE state.");
//           const newValue = message.body.trim();
//           const fieldName = this.updateField;

//           // Validation for Min Level
//           if (fieldName.toLowerCase() === "min level") {
//             const maxLevelField = Object.keys(this.currentItem).find((key) => key.toLowerCase() === "max level");
//             const maxLevel = maxLevelField ? this.currentItem[maxLevelField] : null;
//             if (this.isDefined(maxLevel)) {
//               if (isNaN(newValue) || isNaN(maxLevel)) {
//                 message.reply(MESSAGES.INVALID_NUMERIC);
//                 return;
//               }
//               if (Number(newValue) > Number(maxLevel)) {
//                 message.reply(MESSAGES.INVALID_MIN_LEVEL(maxLevel));
//                 return;
//               }
//             }
//           }
//           // Validation for Max Level
//           else if (fieldName.toLowerCase() === "max level") {
//             const minLevelField = Object.keys(this.currentItem).find((key) => key.toLowerCase() === "min level");
//             const minLevel = minLevelField ? this.currentItem[minLevelField] : null;
//             if (this.isDefined(minLevel)) {
//               if (isNaN(newValue) || isNaN(minLevel)) {
//                 message.reply(MESSAGES.INVALID_NUMERIC);
//                 return;
//               }
//               if (Number(newValue) < Number(minLevel)) {
//                 message.reply(MESSAGES.INVALID_MAX_LEVEL(minLevel));
//                 return;
//               }
//             }
//           }

//           console.log(`[DEBUG] Updating ${fieldName} to ${newValue}`);
//           this.currentItem[this.updateField] = newValue;
//           await this.updateExcelFile();
//           message.reply(MESSAGES.SUCCESS_UPDATE(this.updateField, newValue));
//           message.reply(MESSAGES.UPDATE_CONFIRM);
//           this.state = BotState.UPDATING;
//           this.updateField = null;
//           console.log("[DEBUG] Transitioned back to UPDATING state.");
//           break;

//         case BotState.ADDING_ITEM:
//           console.log("[DEBUG] In ADDING_ITEM state.");
//           // Determine if we're collecting required fields or additional fields
//           let currentField;
//           if (this.currentFieldIndex < REQUIRED_FIELDS.length) {
//             currentField = REQUIRED_FIELDS[this.currentFieldIndex];
//           } else {
//             const additionalFieldIndex = this.currentFieldIndex - REQUIRED_FIELDS.length;
//             currentField = this.fieldsToAdd[additionalFieldIndex];
//           }

//           const inputValue = message.body.trim();
//           let value = ["n/a", "na", "n/a", "n/a"].includes(inputValue.toLowerCase()) ? "" : inputValue;

//           // Check for duplicate Material Code when the user enters it
//           if (currentField === "Material Code") {
//             const existingItem = this.data.find(
//               (entry) =>
//                 entry["Material Code"] &&
//                 entry["Material Code"].toString().trim().toLowerCase() === value.toLowerCase()
//             );
//             if (existingItem) {
//               this.currentItem = existingItem; // Store the existing item
//               message.reply(MESSAGES.DUPLICATE_MATERIAL_CODE_PROMPT(existingItem));
//               this.state = BotState.HANDLING_DUPLICATE;
//               return;
//             }
//           }

//           // Validation for Min Level when adding a new item
//           if (currentField.toLowerCase() === "min level" && "Max Level" in this.newItem) {
//             const maxLevel = this.newItem["Max Level"];
//             if (this.isDefined(maxLevel)) {
//               if (isNaN(value) || isNaN(maxLevel)) {
//                 message.reply(MESSAGES.INVALID_NUMERIC);
//                 return;
//               }
//               if (Number(value) > Number(maxLevel)) {
//                 message.reply(MESSAGES.INVALID_MIN_LEVEL(maxLevel));
//                 return;
//               }
//             }
//           }
//           // Validation for Max Level when adding a new item
//           else if (currentField.toLowerCase() === "max level" && "Min Level" in this.newItem) {
//             const minLevel = this.newItem["Min Level"];
//             if (this.isDefined(minLevel)) {
//               if (isNaN(value) || isNaN(minLevel)) {
//                 message.reply(MESSAGES.INVALID_NUMERIC);
//                 return;
//               }
//               if (Number(value) < Number(minLevel)) {
//                 message.reply(MESSAGES.INVALID_MAX_LEVEL(minLevel));
//                 return;
//               }
//             }
//           }

//           this.newItem[currentField] = value;
//           this.currentFieldIndex++;
//           this.requiredFieldsEntered = Math.min(this.currentFieldIndex, REQUIRED_FIELDS.length);

//           if (this.currentFieldIndex < REQUIRED_FIELDS.length) {
//             message.reply(MESSAGES.ADD_PROMPT(REQUIRED_FIELDS[this.currentFieldIndex]));
//           } else if (this.currentFieldIndex === REQUIRED_FIELDS.length) {
//             if (!this.validateRequiredFields()) {
//               message.reply(MESSAGES.MISSING_REQUIRED_FIELDS);
//               this.state = BotState.IDLE;
//               this.newItem = {};
//               this.currentFieldIndex = 0;
//               this.requiredFieldsEntered = 0;
//               return;
//             }
//             this.state = BotState.ADDING_CONFIRM;
//             message.reply(MESSAGES.ADD_CONFIRM);
//           } else {
//             const additionalFieldIndex = this.currentFieldIndex - REQUIRED_FIELDS.length;
//             if (additionalFieldIndex < this.fieldsToAdd.length) {
//               message.reply(MESSAGES.ADD_PROMPT(this.fieldsToAdd[additionalFieldIndex]));
//             } else {
//               this.data.push(this.newItem);
//               await this.updateExcelFile();
//               message.reply(MESSAGES.SUCCESS_ADD);
//               this.newItem = {};
//               this.currentFieldIndex = 0;
//               this.requiredFieldsEntered = 0;
//               this.state = BotState.IDLE;
//             }
//           }
//           break;

//         case BotState.ADDING_CONFIRM:
//           console.log("[DEBUG] In ADDING_CONFIRM state.");
//           if (userMessage === "done") {
//             if (!this.validateRequiredFields()) {
//               message.reply(MESSAGES.MISSING_REQUIRED_FIELDS);
//               this.state = BotState.IDLE;
//               this.newItem = {};
//               this.currentFieldIndex = 0;
//               this.requiredFieldsEntered = 0;
//               return;
//             }
//             this.fillRemainingFields();
//             this.data.push(this.newItem);
//             await this.updateExcelFile();
//             message.reply(MESSAGES.SUCCESS_ADD);
//             this.newItem = {};
//             this.currentFieldIndex = 0;
//             this.requiredFieldsEntered = 0;
//             this.state = BotState.IDLE;
//           } else if (userMessage === "continue") {
//             this.state = BotState.ADDING_ITEM;
//             const additionalFieldIndex = this.currentFieldIndex - REQUIRED_FIELDS.length;
//             if (additionalFieldIndex < this.fieldsToAdd.length) {
//               message.reply(MESSAGES.ADD_PROMPT(this.fieldsToAdd[additionalFieldIndex]));
//             } else {
//               this.data.push(this.newItem);
//               await this.updateExcelFile();
//               message.reply(MESSAGES.SUCCESS_ADD);
//               this.newItem = {};
//               this.currentFieldIndex = 0;
//               this.requiredFieldsEntered = 0;
//               this.state = BotState.IDLE;
//             }
//           } else {
//             message.reply(MESSAGES.INVALID_INPUT);
//           }
//           break;

//         case BotState.HANDLING_DUPLICATE:
//           console.log("[DEBUG] In HANDLING_DUPLICATE state.");
//           if (userMessage === "yes") {
//             // Show the existing item's details and transition to the UPDATING state
//             message.reply(MESSAGES.ITEM_DETAILS(this.currentItem));
//             this.state = BotState.UPDATING;
//             // Reset the newItem and related fields since we're not adding a new item
//             this.newItem = {};
//             this.currentFieldIndex = 0;
//             this.requiredFieldsEntered = 0;
//           } else if (userMessage === "no") {
//             message.reply("👍 Operation cancelled. Type 'hi' to start again.");
//             this.currentItem = null;
//             this.newItem = {};
//             this.currentFieldIndex = 0;
//             this.requiredFieldsEntered = 0;
//             this.state = BotState.IDLE;
//           } else {
//             message.reply(MESSAGES.INVALID_INPUT);
//           }
//           break;

//         default:
//           console.log("[DEBUG] Unknown state. Resetting to IDLE.");
//           this.state = BotState.IDLE;
//           message.reply(MESSAGES.ERROR);
//           break;
//       }
//     } catch (error) {
//       console.error("Error handling message:", error);
//       message.reply(MESSAGES.ERROR);
//       this.state = BotState.IDLE;
//     }
//   }
// }

// // Initialize the bot
// const bot = new InventoryBot();
// bot.listFiles();





const crypto = require('crypto');
global.crypto = crypto;

const { getDbClient } = require('./database/db');


const { useMultiFileAuthState, makeWASocket, delay, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const xlsx = require('xlsx');
const fs = require('fs');
const { google } = require('googleapis');
const express = require('express');
require('dotenv').config();

// Constants
const ADMIN_PASSWORD = "Luckyferro"; 
const FILE_PATH = "./Inventory_Register.xlsx";
const AUTH_DIR = './baileys_auth';
const SERIAL_NUMBER_FIELD = "S.No";
const REQUIRED_FIELDS = ["Material Code", "Item Description"];
const MESSAGES = {
  WELCOME: "👋 Hi! Please choose an option:\n1. See/Update details of existing data\n2. Add a new item\n3. Download Inventory Excel File\n4. Delete an item\nType 'help' for more commands.",
  SEARCH_PROMPT: "🔍 Please enter a 🔢 Material Code or 🏷️ Item Description to check details (or type 'cancel' to go back):",
  DELETE_PROMPT: "🔍 Please enter a 🔢 Material Code or 🏷️ Item Description to delete (or type 'cancel' to go back):",
  ADD_PROMPT: (field) => `✏️ Enter ${field} (or type 'cancel' to go back):`,
  ADD_CONFIRM: "✅ Material Code and Item Description added. Type 'done' to finish (remaining fields will be set to N/A) or 'continue' to add more details:",
  UPDATE_PROMPT: (fields) => `🛠️ Which field would you like to update?\nAvailable fields:\n${fields}\n(or type 'cancel' to go back)`,
  UPDATE_VALUE_PROMPT: (field) => `✏️ Enter the new value for ${field} (or type 'cancel' to go back):`,
  SELECT_ITEM_PROMPT: (items) => `🔍 Multiple items found. Please select one:\n${items}\nReply with the number of the item (or type 'cancel' to go back).`,
  ITEM_DETAILS: (item) => {
    let reply = "📋 *Item Details:*\n";
    for (const key in item) reply += `📌 *${key}:* ${item[key]}\n`;
    return reply + "\n❓ Do you want to update any information? (yes/no)";
  },
  SUCCESS_ADD: "✅ New item added and Excel file updated on Google Drive!",
  SUCCESS_DELETE: "✅ Item deleted successfully and Excel file updated on Google Drive!",
  SUCCESS_UPDATE: (field, value) => `✅ ${field} updated successfully! New value: ${value}`,
  UPDATE_CONFIRM: "⚙️ Do you want to update anything else? (yes/no)",
  ERROR: "⚠️ An error occurred. Please try again or type 'hi' to restart.",
  INVALID_INPUT: "❌ Invalid input. Please try again.",
  NO_ITEMS_FOUND: "❌ No matching Material Code or Item Description found. Please try again.",
  INVALID_SELECTION: "⚠️ Invalid selection. Please try again.",
  CANCEL: "👍 Operation cancelled. Type 'hi' to start again.",
  HELP: "📖 Available commands:\n- 'hi': Start the bot\n- 'help': Show this message\n- 'cancel': Cancel the current operation\nChoose an option:\n1. See/Update details\n2. Add a new item\n3. Download Inventory Excel File\n4. Delete an item",
  LOADING: "⏳ Loading data, please wait...",
  LIST_ITEMS: (items) => `📋 *All Items:*\n${items}\nType 'hi' to go back to the main menu.`, // No longer directly used
  MISSING_REQUIRED_FIELDS: "❌ Both Material Code and Item Description are required. Item not added. Type 'hi' to start again.",
  INVALID_MIN_LEVEL: (maxLevel) => `❌ Invalid input. Min Level must be <= Max Level (${maxLevel}). Please enter a valid value.`,
  INVALID_MAX_LEVEL: (minLevel) => `❌ Invalid input. Max Level must be >= Min Level (${minLevel}). Please enter a valid value.`,
  INVALID_NUMERIC: "❌ Min Level and Max Level must be numeric values. Please enter a valid number.",
  DUPLICATE_MATERIAL_CODE_PROMPT: (item) =>
    `⚠️ The Material Code already exists:\n${item["S.No"]} - ${item["Material Code"]} - ${item["Item Description"]}\nWould you like to update this item? (yes/no)`,
  PASSWORD_PROMPT: "🔒 Please enter the admin password to proceed:",
  PASSWORD_INCORRECT: "❌ Incorrect password. Access denied. Please try again or type 'hi' to return to the main menu."
};

// Google Drive Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth2Client });


const loadAuthState = async () => {

  const client = await getDbClient();
  
  try {
  
  const result = await client.query('SELECT data FROM whatsapp_sessions WHERE id = $1', ['baileys_auth']);
  
  console.log('🔍 loadAuthState query result:', result);
  
  if (result.rows.length > 0) {
  
  const dbData = JSON.parse(result.rows[0].data);
  
  console.log('🔑 Found auth state in database');
  
  return {
  
  creds: dbData, // Wrap the loaded data in 'creds'
  
  keys: {} // Provide an empty 'keys' object
  
  };
  
  }
  
  console.log('💾 No auth state found in database');
  
  return {
  
  creds: {},
  
  keys: {}
  
  };
  
  } catch (error) {
  
  console.error('❌ Error loading auth state from database:', error);
  
  return {
  
  creds: {},
  
  keys: {}
  
  };
  
  } finally {
  
  if (client) {
  
  client.end();
  
  }
  
  }
  
  };
  
  const saveAuthState = async (creds) => {
  
  const client = await getDbClient();
  
  try {
  
  await client.query(
  
  'INSERT INTO whatsapp_sessions (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
  
  ['baileys_auth', JSON.stringify(creds)]
  
  );
  
  console.log('✅ Auth state saved to database');
  
  } catch (error) {
  
  console.error('❌ Error saving auth state to database:', error);
  
  } finally {
  
  if (client) {
  
  client.end();
  
  }
  
  }
  
  };
const BotState = {
  IDLE: "IDLE",
  INITIAL_MENU: "INITIAL_MENU",
  SEARCHING: "SEARCHING",
  SELECTING_ITEM: "SELECTING_ITEM",
  UPDATING: "UPDATING",
  UPDATING_VALUE: "UPDATING_VALUE",
  ADDING_ITEM: "ADDING_ITEM",
  ADDING_CONFIRM: "ADDING_CONFIRM",
  DELETING_ITEM: "DELETING_ITEM",
  SELECTING_ITEM_TO_DELETE: "SELECTING_ITEM_TO_DELETE",
  HANDLING_DUPLICATE: "HANDLING_DUPLICATE",
  AWAITING_PASSWORD: "AWAITING_PASSWORD" 

};

class InventoryBot {
  constructor() {
    this.userStates = new Map();
    this.data = [];
    this.workbook = null;
    this.sheetName = null;
    this.worksheet = null;
    this.headerRow = null;
    this.sock = null;
    this.driveService = drive;

    this.loadInitialData(); // Call your data loading function
    this.initializeServices();
  }

  async loadInitialData() { // Create this async function
    console.log('Starting initial data load...');
    try {
      await this.loadExcelFile(); // Assuming your data loading function is named this
      console.log('Initial data load complete. this.data.length:', this.data.length);
      if (this.data.length > 0) {
        console.log('First item keys:', Object.keys(this.data[0]));
      } else {
        console.log('this.data array is empty!');
      }
    } catch (error) {
      console.error('Error during initial data load:', error);
    }
  }

  async initializeServices() {
    await this.initializeWhatsApp();
    this.startWebServer();
  }

  

// async initializeWhatsApp() {
//   const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
//   this.sock = makeWASocket({
//     printQRInTerminal: !process.env.RENDER,
//     auth: state,
//     browser: ['Inventory Bot', 'Chrome', '1.0'],
//     getMessage: async () => ({}),
//     markOnlineOnConnect: true,
//   });

//   this.setupEventHandlers(saveCreds); // Use the saveCreds from useMultiFileAuthState
// }

async initializeWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  this.sock = makeWASocket({
    printQRInTerminal: !process.env.RENDER,
    auth: state,
    browser: ['Inventory Bot', 'Chrome', '1.0'],
    getMessage: async () => ({}),
    markOnlineOnConnect: true,
  });

  this.setupEventHandlers(saveCreds);
}


setupEventHandlers(saveCreds) {
  this.sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      this.handleConnectionClose(update);
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connection established');
    }
  });

  this.sock.ev.on('creds.update', saveCreds);

  this.sock.ev.on('messages.upsert', async ({ messages }) => {
    await this.handleMessage(messages[0]);
  });
}




  async handleConnectionClose({ lastDisconnect }) {
    if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      console.log('🔁 Reconnecting...');
      await delay(5000);
      await this.initializeWhatsApp();
    }
  }

  async handleMessage(msg) {
    console.log('handleMessage called');
    console.log('Incoming Message:', msg);
    if (msg.key.fromMe || !msg.message?.conversation) return;
    const jid = msg.key.remoteJid;
    const userMessage = msg.message.conversation.trim();
    const userState = this.userStates.get(jid) || { state: BotState.IDLE, isAuthenticated: false };
    this.userStates.set(jid, userState); // Ensure userState is always set

    try {
      console.log(`[${userState.state}] ${userMessage}`);

      if (userMessage.toLowerCase() === 'cancel' && userState.state !== BotState.IDLE) {
        await this.handleCancelCommand(jid, userState);
        return;
      }

      if (userMessage.toLowerCase() === 'help') {
        await this.sendMessage(jid, MESSAGES.HELP);
        return;
      }

      switch(userState.state) {
        case BotState.IDLE:
          await this.handleIdleState(jid, userMessage.toLowerCase());
          break;
        case BotState.INITIAL_MENU:
          await this.handleInitialMenu(jid, userMessage);
          break;
        case BotState.SEARCHING:
          await this.handleSearchState(jid, userMessage, userState);
          break;
        case BotState.SELECTING_ITEM:
          const selectedIndex = parseInt(userMessage);
          if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= userState.foundItems.length) {
            await this.handleSelectingItem(jid, userMessage, userState);
          } else {
            console.log('Treating input as new search term:', userMessage); // Debugging log
            userState.foundItems = [];
            userState.state = BotState.SEARCHING;
            await this.handleSearchState(jid, userMessage, userState);
          }
          break;
        case BotState.UPDATING:
          await this.handleUpdating(jid, userMessage.toLowerCase(), userState);
          break;
        case BotState.UPDATING_VALUE:
          await this.handleUpdatingValue(jid, userMessage.trim(), userState);
          break;
        case BotState.ADDING_ITEM:
          await this.handleAddingItem(jid, userMessage.trim(), userState);
          break;
        case BotState.ADDING_CONFIRM:
          await this.handleAddingConfirm(jid, userMessage.toLowerCase(), userState);
          break;
        case BotState.DELETING_ITEM:
          await this.handleDeletingItem(jid, userMessage, userState);
          break;
        case BotState.SELECTING_ITEM_TO_DELETE:
          const deleteIndex = parseInt(userMessage);
          if (!isNaN(deleteIndex) && deleteIndex >= 1 && deleteIndex <= userState.foundItems.length) {
            await this.handleSelectingItemToDelete(jid, userMessage, userState);
          } else {
            userState.foundItems = [];
            userState.state = BotState.DELETING_ITEM;
            await this.handleDeletingItem(jid, userMessage, userState);
          }
          break;
        case BotState.HANDLING_DUPLICATE:
          await this.handleDuplicate(jid, userMessage.toLowerCase(), userState);
          break;
        case BotState.AWAITING_PASSWORD:
          await this.handleAwaitingPassword(jid, userMessage, userState);
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
      await this.sendMessage(jid, MESSAGES.ERROR);
      this.userStates.set(jid, { state: BotState.IDLE, isAuthenticated: userState.isAuthenticated || false }); // Preserve auth status on error
    }
  }

  async handleCancelCommand(jid, userState) {
    if (userState.state === BotState.ADDING_ITEM || userState.state === BotState.ADDING_CONFIRM) {
      if (userState.requiredFieldsEntered === REQUIRED_FIELDS.length && this.validateRequiredFields(userState.newItem)) {
        this.fillRemainingFields(userState.newItem, userState.fieldsToAdd);
        this.data.push(userState.newItem);
        await this.updateExcelFile();
        await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
      }
    }
    await this.sendMessage(jid, MESSAGES.CANCEL);
    this.userStates.set(jid, { state: BotState.IDLE });
  }

  async handleIdleState(jid, message) {
    const userState = this.userStates.get(jid) || { state: BotState.IDLE, isAuthenticated: false };
    this.userStates.set(jid, userState); // Ensure userState exists

    if (message === 'hi') {
      if (!userState.isAuthenticated) {
        userState.state = BotState.AWAITING_PASSWORD;
        await this.sendMessage(jid, MESSAGES.PASSWORD_PROMPT);
      } else {
        userState.state = BotState.INITIAL_MENU;
        await this.sendMessage(jid, MESSAGES.WELCOME);
      }
    } else if (message === 'help') {
      await this.sendMessage(jid, MESSAGES.HELP);
    } else {
      await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
    }
  }

  async handleInitialMenu(jid, message) {
    const userState = this.userStates.get(jid);

    switch(message) {
      case '1': // See/Update
        userState.state = BotState.SEARCHING;
        await this.sendMessage(jid, MESSAGES.SEARCH_PROMPT);
        break;
        case '2': // Add new item
  userState.state = BotState.ADDING_ITEM;
  userState.newItem = { [SERIAL_NUMBER_FIELD]: this.generateSerialNumber() };
  userState.currentFieldIndex = 0;
  userState.requiredFieldsEntered = 0;
  // Dynamically determine the optional fields from the Excel header row:
  userState.fieldsToAdd = this.headerRow.filter(field => 
    field !== SERIAL_NUMBER_FIELD && !REQUIRED_FIELDS.includes(field)
  );
  await this.sendMessage(jid, MESSAGES.ADD_PROMPT(REQUIRED_FIELDS[0]));
  break;


      
      case '3': // Download Excel
        await this.sendExcelFile(jid);
        break;
      case '4': // Delete item
        userState.state = BotState.DELETING_ITEM;
        await this.sendMessage(jid, MESSAGES.DELETE_PROMPT);
        break;
      default:
        await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
    }
    this.userStates.set(jid, userState);
  }

  async handleSearchState(jid, query, userState) {
    
    const searchTerm = query.trim().toLowerCase();
    console.log('Search Term:', searchTerm);
    console.log('First few items in this.data:', this.data.slice(0, 3)); // Log a few items
    const results = this.data.filter(item => {
      const materialCode = item["Material Code"]?.toString().toLowerCase() || '';
      const itemDescription = item["Item Description"]?.toString().toLowerCase() || '';
      const match = materialCode.includes(searchTerm) || itemDescription.includes(searchTerm);
      console.log(`Checking item: ${item["Material Code"]} - ${item["Item Description"]}, Material Code Match: ${materialCode.includes(searchTerm)}, Description Match: ${itemDescription.includes(searchTerm)}`);
      return match;
    });

    if (results.length === 0) {
      await this.sendMessage(jid, MESSAGES.NO_ITEMS_FOUND);
      userState.state = BotState.SEARCHING; // Stay in searching state
    } else if (results.length === 1) {
      userState.foundItems = results;
      await this.handleSelectingItem(jid, '1', userState); // Directly select if only one result
    } else {
      userState.foundItems = results;
      const itemList = results.map((item, index) => `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`).join("\n");
      await this.sendMessage(jid, MESSAGES.SELECT_ITEM_PROMPT(itemList + "\n\nReply with the *number* to select, or type a *new search term* (or 'cancel')."));
      userState.state = BotState.SELECTING_ITEM; // Transition to selecting, but with extended functionality
    }
    this.userStates.set(jid, userState);
  }
  async handleSelectingItem(jid, message, userState) {
    const selectedIndex = parseInt(message) - 1;
    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < userState.foundItems.length) {
      userState.currentItem = userState.foundItems[selectedIndex];
      userState.state = BotState.UPDATING;
      await this.sendMessage(jid, MESSAGES.ITEM_DETAILS(userState.currentItem));
    } else {
      await this.sendMessage(jid, MESSAGES.INVALID_SELECTION);
    }
    this.userStates.set(jid, userState);
  }

  // async handleUpdating(jid, message, userState) {
  //   if (message === "yes") {
  //     const availableFields = Object.keys(userState.currentItem).map(field => `📌 ${field}`).join("\n");
  //     await this.sendMessage(jid, MESSAGES.UPDATE_PROMPT(availableFields));
  //   } else if (message === "no") {
  //     await this.sendMessage(jid, "👍 Thank you! Type 'hi' to start again.");
  //     userState.state = BotState.IDLE;
  //   } else if (Object.keys(userState.currentItem).map(key => key.toLowerCase()).includes(message)) {
  //     userState.updateField = Object.keys(userState.currentItem).find(key => key.toLowerCase() === message);
  //     userState.state = BotState.UPDATING_VALUE;
  //     await this.sendMessage(jid, MESSAGES.UPDATE_VALUE_PROMPT(userState.updateField));
  //   } else {
  //     await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
  //   }
  //   this.userStates.set(jid, userState);
  // }

  // async handleUpdatingValue(jid, value, userState) {
  //   const fieldName = userState.updateField;
  //   if (fieldName.toLowerCase() === "min level") {
  //     const maxLevel = userState.currentItem["Max Level"];
  //     if (this.isDefined(maxLevel) && (isNaN(value) || isNaN(maxLevel) || Number(value) > Number(maxLevel))) {
  //       await this.sendMessage(jid, isNaN(value) ? MESSAGES.INVALID_NUMERIC : MESSAGES.INVALID_MIN_LEVEL(maxLevel));
  //       return;
  //     }
  //   } else if (fieldName.toLowerCase() === "max level") {
  //     const minLevel = userState.currentItem["Min Level"];
  //     if (this.isDefined(minLevel) && (isNaN(value) || isNaN(minLevel) || Number(value) < Number(minLevel))) {
  //       await this.sendMessage(jid, isNaN(value) ? MESSAGES.INVALID_NUMERIC : MESSAGES.INVALID_MAX_LEVEL(minLevel));
  //       return;
  //     }
  //   }

  //   userState.currentItem[fieldName] = value;
  //   await this.updateExcelFile();
  //   await this.sendMessage(jid, MESSAGES.SUCCESS_UPDATE(fieldName, value));
  //   await this.sendMessage(jid, MESSAGES.UPDATE_CONFIRM);
  //   userState.state = BotState.UPDATING;
  //   this.userStates.set(jid, userState);
  // }

  async handleUpdating(jid, message, userState) {
    console.log('--- handleUpdating ---');
    console.log('userState:', userState);
    console.log('message:', message);

    if (message === "yes") {
      const availableFields = Object.keys(userState.currentItem).map(field => `📌 ${field}`).join("\n");
      await this.sendMessage(jid, MESSAGES.UPDATE_PROMPT(availableFields));
    } else if (message === "no") {
      await this.sendMessage(jid, "👍 Thank you! Type 'hi' to start again.");
      userState.state = BotState.IDLE;
    } else if (Object.keys(userState.currentItem).map(key => key.toLowerCase().trim()).includes(message.toLowerCase().trim())) {
      userState.updateField = Object.keys(userState.currentItem).find(key => key.toLowerCase().trim() === message.toLowerCase().trim());
      console.log('Selected field to update:', userState.updateField);
      userState.state = BotState.UPDATING_VALUE;
      await this.sendMessage(jid, MESSAGES.UPDATE_VALUE_PROMPT(userState.updateField));
    } else {
      await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
    }
    this.userStates.set(jid, userState);
  }

  async handleUpdatingValue(jid, value, userState) {
    console.log('--- handleUpdatingValue ---');
    console.log('userState:', userState);
    console.log('Value to update:', value);

    const fieldName = userState.updateField;
    if (!fieldName) {
      console.error('Error: updateField is not set in userState.');
      await this.sendMessage(jid, MESSAGES.ERROR);
      userState.state = BotState.UPDATING;
      this.userStates.set(jid, userState);
      return;
    }

    console.log('Before validation:', JSON.stringify(userState.currentItem));

    if (fieldName.toLowerCase() === "min level") {
      const maxLevel = userState.currentItem["Max Level"];
      if (this.isDefined(maxLevel) && (isNaN(value) || isNaN(maxLevel) || Number(value) > Number(maxLevel))) {
        await this.sendMessage(jid, isNaN(value) ? MESSAGES.INVALID_NUMERIC : MESSAGES.INVALID_MIN_LEVEL(maxLevel));
        return;
      }
    } else if (fieldName.toLowerCase() === "max level") {
      const minLevel = userState.currentItem["Min Level"];
      if (this.isDefined(minLevel) && (isNaN(value) || isNaN(minLevel) || Number(value) < Number(minLevel))) {
        await this.sendMessage(jid, isNaN(value) ? MESSAGES.INVALID_NUMERIC : MESSAGES.INVALID_MAX_LEVEL(minLevel));
        return;
      }
    }

    try {
      console.log('Before update:', JSON.stringify(this.data));
      const itemIndex = this.data.findIndex(item => item[SERIAL_NUMBER_FIELD] === userState.currentItem[SERIAL_NUMBER_FIELD]);
      if (itemIndex !== -1) {
        this.data[itemIndex][fieldName] = value;
        userState.currentItem = this.data[itemIndex]; // Keep currentItem in sync
        console.log('After update:', JSON.stringify(this.data));
        await this.updateExcelFile();
        await this.sendMessage(jid, MESSAGES.SUCCESS_UPDATE(fieldName, value));
        await this.sendMessage(jid, MESSAGES.UPDATE_CONFIRM);
        userState.state = BotState.UPDATING;
      } else {
        console.error('Error: Current item not found in data array for update.');
        await this.sendMessage(jid, MESSAGES.ERROR);
        userState.state = BotState.UPDATING;
      }
    } catch (error) {
      console.error('Error during update process:', error);
      await this.sendMessage(jid, MESSAGES.ERROR);
      userState.state = BotState.UPDATING;
    } finally {
      this.userStates.set(jid, userState);
    }
  }

  async handleAddingItem(jid, value, userState) {
    const currentField = userState.currentFieldIndex < REQUIRED_FIELDS.length 
      ? REQUIRED_FIELDS[userState.currentFieldIndex]
      : userState.fieldsToAdd[userState.currentFieldIndex - REQUIRED_FIELDS.length];

    if (currentField === "Material Code") {
      const existingItem = this.data.find(entry => 
        entry["Material Code"]?.toString().trim().toLowerCase() === value.toLowerCase()
      );
      if (existingItem) {
        userState.currentItem = existingItem;
        userState.state = BotState.HANDLING_DUPLICATE;
        await this.sendMessage(jid, MESSAGES.DUPLICATE_MATERIAL_CODE_PROMPT(existingItem));
        this.userStates.set(jid, userState);
        return;
      }
    }

    userState.newItem[currentField] = value;
    userState.currentFieldIndex++;
    userState.requiredFieldsEntered = Math.min(userState.currentFieldIndex, REQUIRED_FIELDS.length);

    if (userState.currentFieldIndex < REQUIRED_FIELDS.length) {
      await this.sendMessage(jid, MESSAGES.ADD_PROMPT(REQUIRED_FIELDS[userState.currentFieldIndex]));
    } else if (userState.currentFieldIndex === REQUIRED_FIELDS.length) {
      if (!this.validateRequiredFields(userState.newItem)) {
        await this.sendMessage(jid, MESSAGES.MISSING_REQUIRED_FIELDS);
        userState.state = BotState.IDLE;
      } else {
        userState.state = BotState.ADDING_CONFIRM;
        await this.sendMessage(jid, MESSAGES.ADD_CONFIRM);
      }
    } else if (userState.currentFieldIndex - REQUIRED_FIELDS.length < userState.fieldsToAdd.length) {
      await this.sendMessage(jid, MESSAGES.ADD_PROMPT(userState.fieldsToAdd[userState.currentFieldIndex - REQUIRED_FIELDS.length]));
    } else {
      this.data.push(userState.newItem);
      await this.updateExcelFile();
      await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
      userState.state = BotState.IDLE;
    }
    this.userStates.set(jid, userState);
  }

  async handleAddingConfirm(jid, message, userState) {
    if (message === "done") {
      if (!this.validateRequiredFields(userState.newItem)) {
        await this.sendMessage(jid, MESSAGES.MISSING_REQUIRED_FIELDS);
      } else {
        this.fillRemainingFields(userState.newItem, userState.fieldsToAdd);
        this.data.push(userState.newItem);
        await this.updateExcelFile();
        await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
      }
      userState.state = BotState.IDLE;
    } else if (message === "continue") {
      userState.state = BotState.ADDING_ITEM;
      const nextField = userState.fieldsToAdd[userState.currentFieldIndex - REQUIRED_FIELDS.length];
      if (nextField) {
        await this.sendMessage(jid, MESSAGES.ADD_PROMPT(nextField));
      } else {
        this.data.push(userState.newItem);
        await this.updateExcelFile();
        await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
        userState.state = BotState.IDLE;
      }
    } else {
      await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
    }
    this.userStates.set(jid, userState);
  }

  // async handleListingItems(jid, userState) {
  //   const itemsList = this.data.map((item, index) => 
  //     `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`
  //   ).join("\n");
  //   await this.sendMessage(jid, MESSAGES.LIST_ITEMS(itemsList));
  //   userState.state = BotState.IDLE;
  //   this.userStates.set(jid, userState);
  // }
  async sendExcelFile(jid) {
    try {
      if (!fs.existsSync(FILE_PATH)) {
        await this.downloadFileFromGoogleDrive(); // Ensure the file exists locally
        if (!fs.existsSync(FILE_PATH)) {
          await this.sendMessage(jid, MESSAGES.ERROR); // File still not found
          return;
        }
      }

      await this.sock.sendMessage(
        jid,
        {
          document: { url: FILE_PATH }, // For local files, you can use the path
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileName: 'Inventory_Register.xlsx'
        }
      );
      await this.sendMessage(jid, "✅ Inventory Excel file sent!");
    } catch (error) {
      console.error('Error sending Excel file:', error);
      await this.sendMessage(jid, MESSAGES.ERROR);
    }
  }
  async handleDeletingItem(jid, input, userState) {
    const searchTerm = input.toLowerCase().trim();
    const foundItems = this.data.filter(entry =>
      (entry["Material Code"]?.toString().toLowerCase().includes(searchTerm)) ||
      (entry["Item Description"]?.toLowerCase().includes(searchTerm))
    );

    if (foundItems.length === 0) {
      await this.sendMessage(jid, MESSAGES.NO_ITEMS_FOUND);
      userState.state = BotState.IDLE;
    } else if (foundItems.length === 1) {
      const itemToDelete = foundItems[0];
      this.data = this.data.filter(item =>
        item[SERIAL_NUMBER_FIELD] !== itemToDelete[SERIAL_NUMBER_FIELD]
      );
      await this.updateExcelFile();
      await this.sendMessage(jid, MESSAGES.SUCCESS_DELETE);
      userState.state = BotState.IDLE;
    } else {
      userState.foundItems = foundItems;
      userState.state = BotState.SELECTING_ITEM_TO_DELETE;
      const itemsList = foundItems.map((item, index) =>
        `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`
      ).join("\n");
      await this.sendMessage(jid, MESSAGES.SELECT_ITEM_PROMPT(itemsList));
    }
    this.userStates.set(jid, userState);
  }

  async handleSelectingItemToDelete(jid, message, userState) {
    const deleteIndex = parseInt(message) - 1;
    if (!isNaN(deleteIndex) && deleteIndex >= 0 && deleteIndex < userState.foundItems.length) {
      const itemToDelete = userState.foundItems[deleteIndex];
      this.data = this.data.filter(item =>
        item[SERIAL_NUMBER_FIELD] !== itemToDelete[SERIAL_NUMBER_FIELD]
      );
      await this.updateExcelFile();
      await this.sendMessage(jid, MESSAGES.SUCCESS_DELETE);
      userState.state = BotState.IDLE;
    } else {
      await this.sendMessage(jid, MESSAGES.INVALID_SELECTION);
      userState.state = BotState.IDLE;
    }
    this.userStates.set(jid, userState);
  }

  async handleDuplicate(jid, message, userState) {
    if (message === "yes") {
      await this.sendMessage(jid, MESSAGES.ITEM_DETAILS(userState.currentItem));
      userState.state = BotState.UPDATING;
    } else if (message === "no") {
      await this.sendMessage(jid, "👍 Operation cancelled. Type 'hi' to start again.");
      userState.state = BotState.IDLE;
    } else {
      await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
    }
    this.userStates.set(jid, userState);
  }
  async handleAwaitingPassword(jid, password, userState) {
    if (password === ADMIN_PASSWORD) {
      userState.isAuthenticated = true; // Set authentication flag
      userState.state = BotState.INITIAL_MENU; // Go directly to the main menu
      await this.sendMessage(jid, MESSAGES.WELCOME);
    } else {
      await this.sendMessage(jid, MESSAGES.PASSWORD_INCORRECT);
      userState.state = BotState.IDLE; // Go back to idle to wait for 'hi' again
    }
    this.userStates.set(jid, userState);
  }

  async sendMessage(jid, content) {
    try {
      await this.sock.sendMessage(jid, { text: content });
    } catch (error) {
      console.error('Message sending error:', error);
    }
  }

  generateSerialNumber() {
    if (!this.data.length) return 1;
    const serialNumbers = this.data.map(item => parseInt(item[SERIAL_NUMBER_FIELD], 10)).filter(num => !isNaN(num));
    return Math.max(...serialNumbers, 0) + 1;
  }

  async downloadFileFromGoogleDrive() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.driveService.files.get(
          { fileId: process.env.GOOGLE_DRIVE_FILE_ID, alt: "media" },
          { responseType: "stream" }
        );
        const writer = fs.createWriteStream(FILE_PATH);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await delay(2000);
      }
    }
  }

  async uploadFileToGoogleDrive() {
    const fileContent = fs.createReadStream(FILE_PATH);
    await this.driveService.files.update({
      fileId: process.env.GOOGLE_DRIVE_FILE_ID,
      media: {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: fileContent,
      },
    });
  }

  async loadExcelFile() {
    if (fs.existsSync(FILE_PATH)) fs.unlinkSync(FILE_PATH);
    await this.downloadFileFromGoogleDrive();
    
    if (!fs.existsSync(FILE_PATH)) {
      this.workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(this.workbook, xlsx.utils.aoa_to_sheet([[]]), "Sheet1");
      xlsx.writeFile(this.workbook, FILE_PATH);
    }

    this.workbook = xlsx.readFile(FILE_PATH);
    this.sheetName = this.workbook.SheetNames[0] || "Sheet1";
    this.worksheet = this.workbook.Sheets[this.sheetName];
    this.headerRow = xlsx.utils.sheet_to_json(this.worksheet, { header: 1 })[0] || [];
    this.data = xlsx.utils.sheet_to_json(this.worksheet).map(entry => {
      return Object.fromEntries(
        Object.entries(entry).map(([key, value]) => [
          key.trim(),
          typeof value === 'string' ? value.trim() : String(value)
        ])
      );
      return normalizedEntry;
    });

    this.materialCodeIndex = new Map();
this.descriptionIndex = new Map();
this.data.forEach((item, index) => {
    this.materialCodeIndex.set(item["Material Code"]?.toString().toLowerCase(), index);
    const keywords = item["Item Description"]?.toLowerCase().split(/\s+/);
    keywords?.forEach(keyword => {
        if (keyword) {
            if (!this.descriptionIndex.has(keyword)) {
                this.descriptionIndex.set(keyword, new Set());
            }
            this.descriptionIndex.get(keyword).add(index);
        }
    });
});
  }

  async updateExcelFile() {
    this.workbook.Sheets[this.sheetName] = xlsx.utils.json_to_sheet(this.data);
    xlsx.writeFile(this.workbook, FILE_PATH);
    await this.uploadFileToGoogleDrive();
  }

  fillRemainingFields(item, fieldsToAdd) {
    fieldsToAdd.forEach(field => {
      if (!(field in item)) item[field] = "N/A";
    });
  }

  validateRequiredFields(item) {
    return REQUIRED_FIELDS.every(field => item[field] && item[field].trim() !== "" && item[field] !== "N/A");
  }

  isDefined(value) {
    return value && value !== "N/A" && value.toString().trim() !== "";
  }

  startWebServer() {
    const app = express();
    const PORT = process.env.PORT;
    app.get('/', (req, res) => res.send('🤖 Inventory Bot Online'));
    app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
  }
}

new InventoryBot();








// const crypto = require('crypto');
// global.crypto = crypto;
// const { Firestore } = require('@google-cloud/firestore');
// const db = new Firestore();
// const WhatsAppAuth = require('./whatsapp');
// const { delay } = require('@whiskeysockets/baileys');
// const xlsx = require('xlsx');
// const fs = require('fs');
// const { google } = require('googleapis');
// const express = require('express');
// require('dotenv').config();

// // Constants
// const FILE_PATH = "/tmp/Inventory_Register.xlsx";
// const SERIAL_NUMBER_FIELD = "S.No";
// const REQUIRED_FIELDS = ["Material Code", "Item Description"];

// const MESSAGES = {
//   WELCOME: "👋 Hi! Please choose an option:\n1. See/Update details of existing data\n2. Add a new item\n3. List all items\n4. Delete an item\nType 'help' for more commands.",
//   SEARCH_PROMPT: "🔍 Please enter a 🔢 Material Code or 🏷️ Item Description to check details (or type 'cancel' to go back):",
//   DELETE_PROMPT: "🔍 Please enter a 🔢 Material Code or 🏷️ Item Description to delete (or type 'cancel' to go back):",
//   ADD_PROMPT: (field) => `✏️ Enter ${field} (or type 'cancel' to go back):`,
//   ADD_CONFIRM: "✅ Material Code and Item Description added. Type 'done' to finish (remaining fields will be set to N/A) or 'continue' to add more details:",
//   UPDATE_PROMPT: (fields) => `🛠️ Which field would you like to update?\nAvailable fields:\n${fields}\n(or type 'cancel' to go back)`,
//   UPDATE_VALUE_PROMPT: (field) => `✏️ Enter the new value for ${field} (or type 'cancel' to go back):`,
//   SELECT_ITEM_PROMPT: (items) => `🔍 Multiple items found. Please select one:\n${items}\nReply with the number of the item (or type 'cancel' to go back).`,
//   ITEM_DETAILS: (item) => {
//     let reply = "📋 *Item Details:*\n";
//     for (const key in item) reply += `📌 *${key}:* ${item[key]}\n`;
//     return reply + "\n❓ Do you want to update any information? (yes/no)";
//   },
//   SUCCESS_ADD: "✅ New item added and Excel file updated on Google Drive!",
//   SUCCESS_DELETE: "✅ Item deleted successfully and Excel file updated on Google Drive!",
//   SUCCESS_UPDATE: (field, value) => `✅ ${field} updated successfully! New value: ${value}`,
//   UPDATE_CONFIRM: "⚙️ Do you want to update anything else? (yes/no)",
//   ERROR: "⚠️ An error occurred. Please try again or type 'hi' to restart.",
//   INVALID_INPUT: "❌ Invalid input. Please try again.",
//   NO_ITEMS_FOUND: "❌ No matching Material Code or Item Description found. Please try again.",
//   INVALID_SELECTION: "⚠️ Invalid selection. Please try again.",
//   CANCEL: "👍 Operation cancelled. Type 'hi' to start again.",
//   HELP: "📖 Available commands:\n- 'hi': Start the bot\n- 'help': Show this message\n- 'cancel': Cancel the current operation\nChoose an option:\n1. See/Update details\n2. Add a new item\n3. List all items\n4. Delete an item",
//   LOADING: "⏳ Loading data, please wait...",
//   LIST_ITEMS: (items) => `📋 *All Items:*\n${items}\nType 'hi' to go back to the main menu.`,
//   MISSING_REQUIRED_FIELDS: "❌ Both Material Code and Item Description are required. Item not added. Type 'hi' to start again.",
//   INVALID_MIN_LEVEL: (maxLevel) => `❌ Invalid input. Min Level must be <= Max Level (${maxLevel}). Please enter a valid value.`,
//   INVALID_MAX_LEVEL: (minLevel) => `❌ Invalid input. Max Level must be >= Min Level (${minLevel}). Please enter a valid value.`,
//   INVALID_NUMERIC: "❌ Min Level and Max Level must be numeric values. Please enter a valid number.",
//   DUPLICATE_MATERIAL_CODE_PROMPT: (item) => 
//     `⚠️ The Material Code already exists:\n${item["S.No"]} - ${item["Material Code"]} - ${item["Item Description"]}\nWould you like to update this item? (yes/no)`
// };

// // Google Drive Configuration
// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   "urn:ietf:wg:oauth:2.0:oob"
// );
// oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
// const drive = google.drive({ version: "v3", auth: oauth2Client });

// // State Management
// const BotState = {
//   IDLE: "IDLE",
//   INITIAL_MENU: "INITIAL_MENU",
//   SEARCHING: "SEARCHING",
//   SELECTING_ITEM: "SELECTING_ITEM",
//   UPDATING: "UPDATING",
//   UPDATING_VALUE: "UPDATING_VALUE",
//   ADDING_ITEM: "ADDING_ITEM",
//   ADDING_CONFIRM: "ADDING_CONFIRM",
//   LISTING_ITEMS: "LISTING_ITEMS",
//   DELETING_ITEM: "DELETING_ITEM",
//   SELECTING_ITEM_TO_DELETE: "SELECTING_ITEM_TO_DELETE",
//   HANDLING_DUPLICATE: "HANDLING_DUPLICATE"
// };

// class InventoryBot {
//   constructor() {
//     this.userStates = new Map();
//     this.data = [];
//     this.firestore = new Firestore();
//     this.workbook = null;
//     this.sheetName = null;
//     this.worksheet = null;
//     this.headerRow = null;
//     this.sock = null;
//     this.driveService = drive;
//     this.whatsappAuth = new WhatsAppAuth();

//     this.initializeServices();
//   }

//   async initializeServices() {
//     try {
//       await this.initializeWhatsApp();
//       this.startWebServer();
//     } catch (error) {
//       console.error('Initialization error:', error);
//     }
//   }

//   async initializeWhatsApp() {
//     try {
//       this.sock = await this.whatsappAuth.initializeSocket();
//       this.setupEventHandlers();
//     } catch (error) {
//       console.error('WhatsApp initialization error:', error);
//     }
//   }

//   setupEventHandlers() {
//     this.sock.ev.on('messages.upsert', async ({ messages }) => {
//       await this.handleMessage(messages[0]);
//     });
//   }
//   async handleConnectionClose({ lastDisconnect }) {
//     if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
//       console.log('🔁 Reconnecting...');
//       await delay(5000);
//       await this.initializeWhatsApp();
//     }
//   }

//   async handleMessage(message) {
//     if (message.key.fromMe || !message.message?.conversation) return;
    
//     const jid = message.key.remoteJid;
//     const userMessage = message.message.conversation.trim().toLowerCase();
//     const userState = this.userStates.get(jid) || { state: BotState.IDLE };

//     try {
//       console.log(`[${userState.state}] ${userMessage}`);

//       if (userMessage === 'cancel' && userState.state !== BotState.IDLE) {
//         await this.handleCancelCommand(jid, userState);
//         return;
//       }

//       if (userMessage === 'help') {
//         await this.sendMessage(jid, MESSAGES.HELP);
//         return;
//       }

//       switch(userState.state) {
//         case BotState.IDLE:
//           await this.handleIdleState(jid, userMessage);
//           break;
//         case BotState.INITIAL_MENU:
//           await this.handleInitialMenu(jid, userMessage);
//           break;
//         case BotState.SEARCHING:
//           await this.handleSearchState(jid, message.message.conversation.trim(), userState);
//           break;
//         case BotState.SELECTING_ITEM:
//           await this.handleSelectingItem(jid, userMessage, userState);
//           break;
//         case BotState.UPDATING:
//           await this.handleUpdating(jid, userMessage, userState);
//           break;
//         case BotState.UPDATING_VALUE:
//           await this.handleUpdatingValue(jid, message.message.conversation.trim(), userState);
//           break;
//         case BotState.ADDING_ITEM:
//           await this.handleAddingItem(jid, message.message.conversation.trim(), userState);
//           break;
//         case BotState.ADDING_CONFIRM:
//           await this.handleAddingConfirm(jid, userMessage, userState);
//           break;
//         case BotState.LISTING_ITEMS:
//           await this.handleListingItems(jid, userState);
//           break;
//         case BotState.DELETING_ITEM:
//           await this.handleDeletingItem(jid, message.message.conversation.trim(), userState);
//           break;
//         case BotState.SELECTING_ITEM_TO_DELETE:
//           await this.handleSelectingItemToDelete(jid, userMessage, userState);
//           break;
//         case BotState.HANDLING_DUPLICATE:
//           await this.handleDuplicate(jid, userMessage, userState);
//           break;
//       }
//     } catch (error) {
//       console.error('Message handling error:', error);
//       await this.sendMessage(jid, MESSAGES.ERROR);
//       this.userStates.set(jid, { state: BotState.IDLE });
//     }
//   }

//   async handleCancelCommand(jid, userState) {
//     if (userState.state === BotState.ADDING_ITEM || userState.state === BotState.ADDING_CONFIRM) {
//       if (userState.requiredFieldsEntered === REQUIRED_FIELDS.length && this.validateRequiredFields(userState.newItem)) {
//         this.fillRemainingFields(userState.newItem, userState.fieldsToAdd);
//         this.data.push(userState.newItem);
//         await this.updateExcelFile();
//         await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
//       }
//     }
//     await this.sendMessage(jid, MESSAGES.CANCEL);
//     this.userStates.set(jid, { state: BotState.IDLE });
//   }

//   async handleIdleState(jid, message) {
//     if (message === 'hi') {
//       await this.loadExcelFile();
//       const userState = {
//         state: BotState.INITIAL_MENU,
//         fieldsToAdd: Object.keys(this.data[0] || {}).filter(field => 
//           field.toLowerCase() !== SERIAL_NUMBER_FIELD.toLowerCase() &&
//           !REQUIRED_FIELDS.map(f => f.toLowerCase()).includes(field.toLowerCase())
//         )
//       };
//       this.userStates.set(jid, userState);
//       await this.sendMessage(jid, MESSAGES.WELCOME);
//     }
//   }

//   async handleInitialMenu(jid, message) {
//     const userState = this.userStates.get(jid);
    
//     switch(message) {
//       case '1':
//         userState.state = BotState.SEARCHING;
//         await this.sendMessage(jid, MESSAGES.SEARCH_PROMPT);
//         break;
//       case '2':
//         userState.state = BotState.ADDING_ITEM;
//         userState.newItem = { [SERIAL_NUMBER_FIELD]: this.generateSerialNumber() };
//         userState.currentFieldIndex = 0;
//         userState.requiredFieldsEntered = 0;
//         await this.sendMessage(jid, MESSAGES.ADD_PROMPT(REQUIRED_FIELDS[0]));
//         break;
//       case '3':
//         userState.state = BotState.LISTING_ITEMS;
//         await this.handleListingItems(jid, userState);
//         break;
//       case '4':
//         userState.state = BotState.DELETING_ITEM;
//         await this.sendMessage(jid, MESSAGES.DELETE_PROMPT);
//         break;
//       default:
//         await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleSearchState(jid, input, userState) {
//     const searchTerm = input.toLowerCase();
    
//     const foundItems = this.data.filter(entry => {
//       const materialCode = String(entry["Material Code"] || '').toLowerCase();
//       const itemDescription = String(entry["Item Description"] || '').toLowerCase();
      
//       return materialCode.startsWith(searchTerm) || 
//              itemDescription.includes(searchTerm);
//     });
  

//     if (foundItems.length === 1) {
//       userState.currentItem = foundItems[0];
//       userState.state = BotState.UPDATING;
//       await this.sendMessage(jid, MESSAGES.ITEM_DETAILS(userState.currentItem));
//     } else if (foundItems.length > 1) {
//       userState.foundItems = foundItems;
//       userState.state = BotState.SELECTING_ITEM;
//       const itemsList = foundItems.map((item, index) => 
//         `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`
//       ).join("\n");
//       await this.sendMessage(jid, MESSAGES.SELECT_ITEM_PROMPT(itemsList));
//     } else {
//       await this.sendMessage(jid, MESSAGES.NO_ITEMS_FOUND);
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleSelectingItem(jid, message, userState) {
//     const selectedIndex = parseInt(message) - 1;
//     if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < userState.foundItems.length) {
//       userState.currentItem = userState.foundItems[selectedIndex];
//       userState.state = BotState.UPDATING;
//       await this.sendMessage(jid, MESSAGES.ITEM_DETAILS(userState.currentItem));
//     } else {
//       await this.sendMessage(jid, MESSAGES.INVALID_SELECTION);
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleUpdating(jid, message, userState) {
//     if (message === "yes") {
//       const availableFields = Object.keys(userState.currentItem).map(field => `📌 ${field}`).join("\n");
//       await this.sendMessage(jid, MESSAGES.UPDATE_PROMPT(availableFields));
//     } else if (message === "no") {
//       await this.sendMessage(jid, "👍 Thank you! Type 'hi' to start again.");
//       userState.state = BotState.IDLE;
//     } else if (Object.keys(userState.currentItem).map(key => key.toLowerCase()).includes(message)) {
//       userState.updateField = Object.keys(userState.currentItem).find(key => key.toLowerCase() === message);
//       userState.state = BotState.UPDATING_VALUE;
//       await this.sendMessage(jid, MESSAGES.UPDATE_VALUE_PROMPT(userState.updateField));
//     } else {
//       await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleUpdatingValue(jid, value, userState) {
//     const fieldName = userState.updateField;
//     if (fieldName.toLowerCase() === "min level") {
//       const maxLevel = userState.currentItem["Max Level"];
//       if (this.isDefined(maxLevel) && (isNaN(value) || isNaN(maxLevel) || Number(value) > Number(maxLevel))) {
//         await this.sendMessage(jid, isNaN(value) ? MESSAGES.INVALID_NUMERIC : MESSAGES.INVALID_MIN_LEVEL(maxLevel));
//         return;
//       }
//     } else if (fieldName.toLowerCase() === "max level") {
//       const minLevel = userState.currentItem["Min Level"];
//       if (this.isDefined(minLevel) && (isNaN(value) || isNaN(minLevel) || Number(value) < Number(minLevel))) {
//         await this.sendMessage(jid, isNaN(value) ? MESSAGES.INVALID_NUMERIC : MESSAGES.INVALID_MAX_LEVEL(minLevel));
//         return;
//       }
//     }

//     userState.currentItem[fieldName] = value;
//     await this.updateExcelFile();
//     await this.sendMessage(jid, MESSAGES.SUCCESS_UPDATE(fieldName, value));
//     await this.sendMessage(jid, MESSAGES.UPDATE_CONFIRM);
//     userState.state = BotState.UPDATING;
//     this.userStates.set(jid, userState);
//   }

//   async handleAddingItem(jid, value, userState) {
//     const currentField = userState.currentFieldIndex < REQUIRED_FIELDS.length 
//       ? REQUIRED_FIELDS[userState.currentFieldIndex]
//       : userState.fieldsToAdd[userState.currentFieldIndex - REQUIRED_FIELDS.length];

//     if (currentField === "Material Code") {
//       const existingItem = this.data.find(entry => 
//         entry["Material Code"]?.toString().trim().toLowerCase() === value.toLowerCase()
//       );
//       if (existingItem) {
//         userState.currentItem = existingItem;
//         userState.state = BotState.HANDLING_DUPLICATE;
//         await this.sendMessage(jid, MESSAGES.DUPLICATE_MATERIAL_CODE_PROMPT(existingItem));
//         this.userStates.set(jid, userState);
//         return;
//       }
//     }

//     userState.newItem[currentField] = value;
//     userState.currentFieldIndex++;
//     userState.requiredFieldsEntered = Math.min(userState.currentFieldIndex, REQUIRED_FIELDS.length);

//     if (userState.currentFieldIndex < REQUIRED_FIELDS.length) {
//       await this.sendMessage(jid, MESSAGES.ADD_PROMPT(REQUIRED_FIELDS[userState.currentFieldIndex]));
//     } else if (userState.currentFieldIndex === REQUIRED_FIELDS.length) {
//       if (!this.validateRequiredFields(userState.newItem)) {
//         await this.sendMessage(jid, MESSAGES.MISSING_REQUIRED_FIELDS);
//         userState.state = BotState.IDLE;
//       } else {
//         userState.state = BotState.ADDING_CONFIRM;
//         await this.sendMessage(jid, MESSAGES.ADD_CONFIRM);
//       }
//     } else if (userState.currentFieldIndex - REQUIRED_FIELDS.length < userState.fieldsToAdd.length) {
//       await this.sendMessage(jid, MESSAGES.ADD_PROMPT(userState.fieldsToAdd[userState.currentFieldIndex - REQUIRED_FIELDS.length]));
//     } else {
//       this.data.push(userState.newItem);
//       await this.updateExcelFile();
//       await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
//       userState.state = BotState.IDLE;
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleAddingConfirm(jid, message, userState) {
//     if (message === "done") {
//       if (!this.validateRequiredFields(userState.newItem)) {
//         await this.sendMessage(jid, MESSAGES.MISSING_REQUIRED_FIELDS);
//       } else {
//         this.fillRemainingFields(userState.newItem, userState.fieldsToAdd);
//         this.data.push(userState.newItem);
//         await this.updateExcelFile();
//         await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
//       }
//       userState.state = BotState.IDLE;
//     } else if (message === "continue") {
//       userState.state = BotState.ADDING_ITEM;
//       const nextField = userState.fieldsToAdd[userState.currentFieldIndex - REQUIRED_FIELDS.length];
//       if (nextField) {
//         await this.sendMessage(jid, MESSAGES.ADD_PROMPT(nextField));
//       } else {
//         this.data.push(userState.newItem);
//         await this.updateExcelFile();
//         await this.sendMessage(jid, MESSAGES.SUCCESS_ADD);
//         userState.state = BotState.IDLE;
//       }
//     } else {
//       await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleListingItems(jid, userState) {
//     const itemsList = this.data.map((item, index) => 
//       `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`
//     ).join("\n");
//     await this.sendMessage(jid, MESSAGES.LIST_ITEMS(itemsList));
//     userState.state = BotState.IDLE;
//     this.userStates.set(jid, userState);
//   }

//   async handleDeletingItem(jid, input, userState) {
//     const foundItems = this.data.filter(entry =>
//       (entry["Material Code"]?.toString().trim().toLowerCase().startsWith(input.toLowerCase())) ||
//       (entry["Item Description"]?.toLowerCase().includes(input.toLowerCase()))
//     );

//     if (foundItems.length === 1) {
//       this.data = this.data.filter(item => 
//         item["Material Code"] !== foundItems[0]["Material Code"] || 
//         item["Item Description"] !== foundItems[0]["Item Description"]
//       );
//       await this.updateExcelFile();
//       await this.sendMessage(jid, MESSAGES.SUCCESS_DELETE);
//       userState.state = BotState.IDLE;
//     } else if (foundItems.length > 1) {
//       userState.foundItems = foundItems;
//       userState.state = BotState.SELECTING_ITEM_TO_DELETE;
//       const itemsList = foundItems.map((item, index) => 
//         `${index + 1}. ${item[SERIAL_NUMBER_FIELD]} - ${item["Material Code"]} - ${item["Item Description"]}`
//       ).join("\n");
//       await this.sendMessage(jid, MESSAGES.SELECT_ITEM_PROMPT(itemsList));
//     } else {
//       await this.sendMessage(jid, MESSAGES.NO_ITEMS_FOUND);
//       userState.state = BotState.IDLE;
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleSelectingItemToDelete(jid, message, userState) {
//     const deleteIndex = parseInt(message) - 1;
//     if (!isNaN(deleteIndex) && deleteIndex >= 0 && deleteIndex < userState.foundItems.length) {
//       const itemToDelete = userState.foundItems[deleteIndex];
//       this.data = this.data.filter(item => 
//         item["Material Code"] !== itemToDelete["Material Code"] || 
//         item["Item Description"] !== itemToDelete["Item Description"]
//       );
//       await this.updateExcelFile();
//       await this.sendMessage(jid, MESSAGES.SUCCESS_DELETE);
//       userState.state = BotState.IDLE;
//     } else {
//       await this.sendMessage(jid, MESSAGES.INVALID_SELECTION);
//       userState.state = BotState.IDLE;
//     }
//     this.userStates.set(jid, userState);
//   }

//   async handleDuplicate(jid, message, userState) {
//     if (message === "yes") {
//       await this.sendMessage(jid, MESSAGES.ITEM_DETAILS(userState.currentItem));
//       userState.state = BotState.UPDATING;
//     } else if (message === "no") {
//       await this.sendMessage(jid, "👍 Operation cancelled. Type 'hi' to start again.");
//       userState.state = BotState.IDLE;
//     } else {
//       await this.sendMessage(jid, MESSAGES.INVALID_INPUT);
//     }
//     this.userStates.set(jid, userState);
//   }

//   async sendMessage(jid, content) {
//     try {
//       await this.sock.sendMessage(jid, { text: content });
//     } catch (error) {
//       console.error('Message sending error:', error);
//     }
//   }

//   generateSerialNumber() {
//     if (!this.data.length) return 1;
//     const serialNumbers = this.data.map(item => parseInt(item[SERIAL_NUMBER_FIELD], 10)).filter(num => !isNaN(num));
//     return Math.max(...serialNumbers, 0) + 1;
//   }

//   async downloadFileFromGoogleDrive() {
//     const maxRetries = 3;
//     for (let attempt = 1; attempt <= maxRetries; attempt++) {
//       try {
//         const response = await this.driveService.files.get(
//           { fileId: process.env.GOOGLE_DRIVE_FILE_ID, alt: "media" },
//           { responseType: "stream" }
//         );
//         const writer = fs.createWriteStream(FILE_PATH);
//         response.data.pipe(writer);
//         return new Promise((resolve, reject) => {
//           writer.on("finish", resolve);
//           writer.on("error", reject);
//         });
//       } catch (error) {
//         if (attempt === maxRetries) throw error;
//         await delay(2000);
//       }
//     }
//   }

//   async uploadFileToGoogleDrive() {
//     const fileContent = fs.createReadStream(FILE_PATH);
//     await this.driveService.files.update({
//       fileId: process.env.GOOGLE_DRIVE_FILE_ID,
//       media: {
//         mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         body: fileContent,
//       },
//     });
//   }

//   async loadExcelFile() {
//     if (fs.existsSync(FILE_PATH)) fs.unlinkSync(FILE_PATH);
//     await this.downloadFileFromGoogleDrive();
    
//     if (!fs.existsSync(FILE_PATH)) {
//       this.workbook = xlsx.utils.book_new();
//       xlsx.utils.book_append_sheet(this.workbook, xlsx.utils.aoa_to_sheet([[]]), "Sheet1");
//       xlsx.writeFile(this.workbook, FILE_PATH);
//     }

//     this.workbook = xlsx.readFile(FILE_PATH);
//     this.sheetName = this.workbook.SheetNames[0] || "Sheet1";
//     this.worksheet = this.workbook.Sheets[this.sheetName];
//     this.headerRow = xlsx.utils.sheet_to_json(this.worksheet, { header: 1 })[0] || [];
//     this.data = xlsx.utils.sheet_to_json(this.worksheet).map(entry => {
//       return Object.fromEntries(
//         Object.entries(entry).map(([key, value]) => [
//           key.trim(),
//           typeof value === 'string' ? value.trim() : String(value)
//         ])
//       );
//       return normalizedEntry;
//     });
//   }

//   async updateExcelFile() {
//     this.workbook.Sheets[this.sheetName] = xlsx.utils.json_to_sheet(this.data);
//     xlsx.writeFile(this.workbook, FILE_PATH);
//     await this.uploadFileToGoogleDrive();
//   }

//   fillRemainingFields(item, fieldsToAdd) {
//     fieldsToAdd.forEach(field => {
//       if (!(field in item)) item[field] = "N/A";
//     });
//   }

//   validateRequiredFields(item) {
//     return REQUIRED_FIELDS.every(field => item[field] && item[field].trim() !== "" && item[field] !== "N/A");
//   }

//   isDefined(value) {
//     return value && value !== "N/A" && value.toString().trim() !== "";
//   }

//   startWebServer() {
//     const app = express();
//     const PORT = process.env.PORT || 3000;
//     app.get('/', (req, res) => res.send('🤖 Inventory Bot Online'));
//     app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
//   }
// }

// new InventoryBot();


















