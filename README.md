# mongo-backup-to-s3

This project is a Node.js backup utility that automatically creates a compressed backup of your MongoDB database and uploads it to an S3‑compatible cloud storage (e.g., Storj). The process is scheduled using `node-cron` (default: every day at 2:00 AM) and can be deployed as a background process using PM2.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment with PM2](#deployment-with-pm2)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

This utility performs the following steps:

1. **Create a Backup:** Uses `mongodump` to create a gzip‑compressed archive of your specified MongoDB database.
2. **Upload Backup:** Uploads the backup file to your Storj bucket using the AWS SDK (S3‑compatible API).
3. **Cleanup:** Deletes the local backup file upon successful upload.
4. **Scheduling:** Uses `node-cron` to automatically run the backup process on a specified schedule.

## Features

- **Automated Backups:** Dumps and compresses your MongoDB database.
- **Cloud Upload:** Uploads backup files to Storj or any S3‑compatible storage.
- **Local Cleanup:** Removes the local backup file after a successful upload.
- **Scheduled Execution:** Configurable cron schedule (default is every day at 2:00 AM).
- **PM2 Deployment:** Easily managed as a background process with PM2.

## Requirements

- Node.js (v14 or later recommended)
- MongoDB Database Tools installed (ensure `mongodump` is in your PATH)
- npm
- A Storj (or other S3‑compatible) account and credentials
- (Optional) PM2 for process management

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/mongo-backup-to-s3.git
   cd mongo-backup-to-s3
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Ensure `mongodump` is Installed:**

   On macOS, install via Homebrew:

   ```bash
   brew tap mongodb/brew
   brew install mongodb-database-tools
   ```

   Verify with:

   ```bash
   which mongodump
   ```

## Configuration

1. **Create a `.env` File in the Project Root:**

   Create a file named `.env` and add the following keys (adjust the values as needed):

   ```ini
   # MongoDB configuration
   MONGO_DB=encrypted-locker
   MONGO_HOST=127.0.0.1
   MONGO_PORT=27017
   # Uncomment and add these if your production DB requires authentication:
   # MONGO_USER=your_username
   # MONGO_PASSWORD=your_password

   # Local backup directory (ensure this folder exists)
   BACKUP_DIR=/path/to/your/backup/directory

   # Storj (S3-compatible) configuration
   STORJ_BUCKET=your-storj-bucket
   STORJ_PATH=backups/           # Optional subfolder inside the bucket
   STORJ_ENDPOINT=https://gateway.storjshare.io
   STORJ_ACCESS_KEY=your-access-key
   STORJ_SECRET_KEY=your-secret-key
   ```

2. **Adjust the Backup Command (if needed):**

   In `backup.js`, you’ll notice two versions of the `cmd` variable—one for local backups and one (commented out) for production with authentication. Uncomment and modify the production command if needed.

## Usage

### Running Locally

To run the backup process immediately for testing, execute:

```bash
node backup.js
```

The script will:
- Run `mongodump` to create a backup file (named based on the current date).
- Upload the file to Storj.
- Delete the local backup file upon successful upload.

### Scheduling

The script uses `node-cron` with the following expression:

```js
cron.schedule("0 2 * * *", () => { ... });
```

This schedules the backup to run every day at 2:00 AM. Modify the cron expression if you need a different schedule.

## Deployment with PM2

PM2 allows you to run your backup script continuously and ensures it restarts automatically on crashes or system reboots.

### 1. Install PM2 Globally

```bash
npm install -g pm2
```

### 2. (Optional) Update Your Package.json

Add a `start` script to your `package.json`:

```json
"scripts": {
  "start": "node backup.js"
}
```

### 3. Start the Script with PM2

From your project directory, start the process using:

```bash
pm2 start npm --name database-backup -- run start
```

This command tells PM2 to run `npm start` and names the process `database-backup`.

### 4. Verify the Process

List your PM2 processes with:

```bash
pm2 list
```

You should see `database-backup` listed with a status of "online."

### 5. Configure PM2 to Restart on Boot

Run the following to set up PM2 startup:

```bash
pm2 startup
```

PM2 will output a command—copy and execute it (you may need to run it with `sudo`). Then save your process list:

```bash
pm2 save
```

This ensures PM2 restores your process on server reboot.

### 6. Managing the Process

- **View Logs:**

  ```bash
  pm2 logs database-backup
  ```

- **Restart the Process:**

  ```bash
  pm2 restart database-backup
  ```

- **Stop or Delete the Process:**

  ```bash
  pm2 stop database-backup
  pm2 delete database-backup
  ```

## Troubleshooting

- **`mongodump: command not found`:**  
  Ensure MongoDB Database Tools are installed and `mongodump` is in your system PATH.
- **AWS SDK Warning:**  
  A warning about AWS SDK v2 may appear. This does not affect functionality, but consider migrating to v3 when feasible.
- **Cron Schedule Issues:**  
  Verify your cron expression using [crontab.guru](https://crontab.guru/).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
