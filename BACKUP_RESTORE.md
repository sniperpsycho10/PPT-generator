# Backup and Restore Procedures

This document outlines how to safely backup and restore the JSPL Continuous Improvement Platform. The application relies on two main storage components:
1. **The PostgreSQL Database**: Contains all structured data, user accounts, and text content.
2. **The File System (`data/uploads`)**: Contains all securely uploaded images and attachments.

---

## 1. Backing Up the System

### 1.1 Database Backup
To backup the PostgreSQL database, use the `pg_dump` utility. Run this on the machine hosting the database or a machine with access to it.

```bash
# Export the database to a compressed custom format file
pg_dump -U <db_user> -h <db_host> -d <db_name> -F c -f jspl_backup_$(date +%F).dump
```

*Example for local dev environment:*
```bash
pg_dump -U postgres -h localhost -d jspl_db -F c -f jspl_backup_$(date +%F).dump
```

### 1.2 File System Backup
The uploaded files (images, PDFs) are stored in `data/uploads/` at the root of the project.
Create an archive of this directory:

```bash
# Create a tarball of the uploads folder
tar -czvf jspl_uploads_backup_$(date +%F).tar.gz data/uploads/
```

### 1.3 Best Practices
- **Automation**: Setup a `cron` job to run the above commands daily at midnight.
- **Off-site Storage**: Copy the resulting `.dump` and `.tar.gz` files to an off-site location (e.g., AWS S3, Google Cloud Storage, or a separate backup server).

---

## 2. Restoring the System

> [!WARNING]
> Restoring the database will overwrite the current database contents. Ensure you are restoring to the correct environment.

### 2.1 Database Restore
Use the `pg_restore` utility to import the data back into the database.

```bash
# First, clear the existing database if needed, or create a fresh one
dropdb -U <db_user> -h <db_host> <db_name>
createdb -U <db_user> -h <db_host> <db_name>

# Restore the dump
pg_restore -U <db_user> -h <db_host> -d <db_name> -1 jspl_backup_YYYY-MM-DD.dump
```

### 2.2 File System Restore
To restore the uploaded files, extract the tar archive into the project root.

```bash
# Extract the archive
tar -xzvf jspl_uploads_backup_YYYY-MM-DD.tar.gz

# Ensure the app has the correct permissions to read/write to the restored folder
chmod -R 755 data/uploads/
```

### 2.3 Verification
After a restore, always perform the following checks:
1. Log in to the application and ensure user accounts exist.
2. Go to the Admin Dashboard -> Reporting Analytics to verify historical data is present.
3. Open a submission and ensure the attached images load correctly (verifying the file system restore).
4. Hit the `/api/health` endpoint to ensure the system reports `healthy: true`.
