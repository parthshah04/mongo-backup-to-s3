// backup.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cron = require("node-cron");
const AWS = require("aws-sdk");

// Read configuration from .env
const {
  MONGO_DB,
  MONGO_HOST,
  MONGO_PORT,
  BACKUP_DIR,
  STORJ_BUCKET,
  STORJ_PATH,
  STORJ_ENDPOINT,
  STORJ_ACCESS_KEY,
  STORJ_SECRET_KEY,
} = process.env;

// Configure the S3 client to point to Storj (S3-compatible)
const s3 = new AWS.S3({
  accessKeyId: STORJ_ACCESS_KEY,
  secretAccessKey: STORJ_SECRET_KEY,
  endpoint: STORJ_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

// Generate a backup filename based on current date
const getBackupFilename = () => {
  const date = new Date();
  return `backup-${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}.gz`;
};

// Full path of the backup file
const backupFilePath = () => path.join(BACKUP_DIR, getBackupFilename());

// Step 1. Create a MongoDB backup using mongodump
const createBackup = () => {
  return new Promise((resolve, reject) => {
    const backupFile = backupFilePath();
    // This command uses mongodump to dump the specified database,
    // compressing the output with gzip into a single archive file.

    // Local backup
    // const cmd = `mongodump --db ${MONGO_DB} --host ${MONGO_HOST} --port ${MONGO_PORT} --gzip --archive=${backupFile}`;

    // Production backup
    const cmd = `mongodump --db ${MONGO_DB} --host ${MONGO_HOST} --port ${MONGO_PORT} --username ${process.env.MONGO_USER} --password ${process.env.MONGO_PASSWORD} --gzip --archive=${backupFile}`;

    console.log("Executing:", cmd);
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("Backup error:", error);
        return reject(error);
      }
      console.log("Backup file created at:", backupFile);
      resolve(backupFile);
    });
  });
};

// Step 2. Upload the backup file to Storj using the S3-compatible API
const uploadBackupToStorj = (backupFile) => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(backupFile);
    fileStream.on("error", (err) => {
      console.error("File error:", err);
      reject(err);
    });
    const key = path.join(STORJ_PATH, path.basename(backupFile));
    const params = {
      Bucket: STORJ_BUCKET,
      Key: key,
      Body: fileStream,
    };
    console.log("Uploading backup to Storj as:", key);
    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Upload error:", err);
        return reject(err);
      }
      console.log("Upload successful:", data.Location);
      resolve(data);
    });
  });
};

// Step 3. Delete the local backup file after upload
const deleteLocalBackup = (backupFile) => {
  return new Promise((resolve, reject) => {
    fs.unlink(backupFile, (err) => {
      if (err) {
        console.error("Error deleting local backup:", err);
        return reject(err);
      }
      console.log("Local backup deleted:", backupFile);
      resolve();
    });
  });
};

// Combined backup process: create, upload, and then delete local backup
const processBackup = async () => {
  try {
    const backupFile = await createBackup();
    await uploadBackupToStorj(backupFile);
    await deleteLocalBackup(backupFile);
    console.log("Backup process completed successfully.");
  } catch (err) {
    console.error("Backup process failed:", err);
  }
};

// Schedule the backup process using node-cron.
// For example, to run every day at 2:00 AM, use: '0 2 * * *'
cron.schedule("0 2 * * *", () => {
  console.log("Starting scheduled backup process...");
  processBackup();
});

// Optionally, run a backup immediately (for testing)
// processBackup();
