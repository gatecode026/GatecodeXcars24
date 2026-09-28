# MongoDB Database Migration Guide

This guide describes how to migrate the MongoDB database from the live GatecodeXcars24 database cluster to your own MongoDB Atlas cluster. Follow these instructions step by step to backup all collections, documents, indexes, and restore them with zero data loss.

---

## Prerequisites: Install MongoDB Database Tools

To backup and restore MongoDB databases, you need `mongodump` and `mongorestore` which are part of the **MongoDB Database Tools**.

### Method 1: Using `winget` (Recommended & Fastest on Windows)
1. Open PowerShell or Command Prompt.
2. Run the following command:
   ```cmd
   winget install MongoDB.DatabaseTools
   ```
3. Once completed, restart your terminal to reload your Environment Variables.
4. Verify by running:
   ```cmd
   mongodump --version
   ```

### Method 2: Manual ZIP Installation
1. Go to the [MongoDB Database Tools Download page](https://www.mongodb.com/try/download/database-tools).
2. Choose **Windows**, download the **ZIP** package.
3. Extract the downloaded ZIP file.
4. Copy the `bin` folder files (which contains `mongodump.exe` and `mongorestore.exe`) to a location on your computer, e.g., `C:\mongodb-tools\bin`.
5. Add `C:\mongodb-tools\bin` to your system's Environment Variables **PATH**:
   - Press **Windows Key**, search for **"Edit the system environment variables"** and open it.
   - Click **Environment Variables...**
   - Under **System variables**, select **Path** and click **Edit...**
   - Click **New** and paste: `C:\mongodb-tools\bin`
   - Click **OK** on all windows, then restart your terminal.

---

## 1. Configure Your Target MongoDB Atlas Cluster

Before restoring, configure your new MongoDB Atlas cluster to accept connections:

1. **Database User Setup**:
   - Go to your MongoDB Atlas dashboard.
   - Click **Database Access** under the *Security* section in the left sidebar.
   - Click **Add New Database User**.
   - Set authentication type to **Password**. Set a Username and Password.
   - Under **Database User Privileges**, select **Read and write to any database** (or choose *Built-in Role* -> `readWrite@<your_db_name>`).
   - Click **Add User**.
   
2. **Network Access (IP Whitelisting)**:
   - Click **Network Access** under the *Security* section.
   - Click **Add IP Address**.
   - If your system runs locally or is deployed to hosting services with dynamic IPs (like Vercel or Render), click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
   - Click **Confirm** and wait for the status to change to *Active*.

3. **Get Your Target Connection String**:
   - Click **Database** under the *Deployment* section.
   - Click **Connect** on your Cluster.
   - Choose **Drivers**.
   - Copy the Connection String. It should look like this:
     ```
     mongodb+srv://<username>:<password>@<your-cluster-address>.mongodb.net/<database_name>?retryWrites=true&w=majority
     ```
   - Replace `<username>`, `<password>`, and `<database_name>` with your actual database user credentials and target database name (e.g., `bpo_project` or `bpo-management`).

---

## 2. Backup the Live Database (mongodump)

The current live BPO Management System database uses the connection string:
`mongodb+srv://bishtsanju29848_db_user:ZQYuMuzvFCZUFC0B@cluster0.r99qidg.mongodb.net/bpo_project`

To backup this database, open your terminal (PowerShell or Command Prompt) and run:

```cmd
mongodump --uri="mongodb+srv://bishtsanju29848_db_user:ZQYuMuzvFCZUFC0B@cluster0.r99qidg.mongodb.net/bpo_project" --out="./db_backup"
```

### What this does:
This command downloads a complete copy of the database and saves it into a directory named `db_backup/bpo_project/` in your current directory. It includes:
- BSON files for all collections (containing the actual data).
- JSON files containing index metadata.

---

## 3. Restore to Your MongoDB Atlas Cluster (mongorestore)

Once you have your backup files and your new Atlas connection string ready, run the following command to restore the database to your new cluster:

```cmd
mongorestore --uri="<YOUR_NEW_ATLAS_CONNECTION_STRING>" "./db_backup"
```

### Example:
If your new Atlas connection string is `mongodb+srv://admin:mysecurepassword@mycluster.abcde.mongodb.net/bpo_project?retryWrites=true&w=majority`, run:
```cmd
mongorestore --uri="mongodb+srv://admin:mysecurepassword@mycluster.abcde.mongodb.net/bpo_project?retryWrites=true&w=majority" "./db_backup"
```

### What this does:
This recreates all collections, restores all documents, and rebuilds the indexes on your new MongoDB Atlas cluster exactly as they were on the source database.

---

## 4. Verify the Migration

To make sure all data was migrated without loss:

1. **Verify via MongoDB Atlas Dashboard**:
   - Go to your Atlas dashboard and select **Database**.
   - Click **Browse Collections** on your Cluster.
   - Verify that all collections are present (e.g., `users`, `orders`, `returns`, `customers`, `callingrecords`, `employeerecords`).
   - Check that the document counts are identical.

2. **Verify via our Verification Script**:
   - We have created a helper script inside this project: [migration_verify.js](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/BPO%20Management/server/src/scripts/migration_verify.js).
   - In `server/.env`, set `MONGO_URI` to your **NEW** connection string.
   - Run the script:
     ```bash
     cd server
     node src/scripts/migration_verify.js
     ```
   - This script connects to the database, prints out the list of collections, counts the documents, and lists some sample records.

---

## 5. Safely Update Application Configuration

To point your application to the new database:

1. **Update Local Configuration**:
   - Open your [server/.env](file:///c:/Users/uttam%20rajpurrohit/OneDrive/Desktop/BPO%20Management/server/.env) file.
   - Update the `MONGO_URI` variable to your new connection string:
     ```env
     MONGO_URI=mongodb+srv://<new_user>:<new_pass>@<new-cluster>.mongodb.net/<new_db_name>?retryWrites=true&w=majority
     ```
   - Keep a commented backup of the old connection string just in case:
     ```env
     # Backup of old URI:
     # MONGO_URI_OLD=mongodb+srv://bishtsanju29848_db_user:ZQYuMuzvFCZUFC0B@cluster0.r99qidg.mongodb.net/bpo_project
     ```

2. **Update Live Production Configuration (Render)**:
   - Log in to your **Render** dashboard.
   - Go to your `bpo-management-server` web service.
   - Click **Environment** in the left sidebar.
   - Edit the `MONGO_URI` environment variable, pasting your new connection string.
   - Click **Save Changes**. Render will automatically redeploy the backend with the new database configuration.
