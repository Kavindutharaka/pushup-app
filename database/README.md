# Weekend Fitness Challenge - Database Setup

## Overview
This system tracks all player data, scores, and session winners using MySQL database with PHP backend running on XAMPP Apache server.

## Features
- **Session Tracking**: Each leaderboard reset creates a new session
- **Player Scores**: All attempts are recorded with name, contact, score, and timestamp
- **Winners Archive**: Top 3 players are captured when leaderboard is reset
- **Admin Panel**: View all historical data with color-coded sessions

## Database Schema

### Tables

1. **sessions** - Tracks each game session
   - `session_id` - Unique session identifier
   - `challenge_type` - Type of challenge (pushup, plank, basketball, football, quickreaction)
   - `session_start_time` - When session started
   - `session_end_time` - When session ended (leaderboard reset)
   - `status` - active or completed

2. **player_scores** - All individual player attempts
   - `score_id` - Unique score identifier
   - `session_id` - Links to session
   - `challenge_type` - Challenge type
   - `player_name` - Player's name
   - `player_contact` - Phone/contact number
   - `score` - Performance score
   - `played_at` - When the game was played

3. **session_winners** - Top 3 winners per session
   - `winner_id` - Unique winner record
   - `session_id` - Links to session
   - `rank_position` - 1, 2, or 3
   - `player_name` - Winner's name
   - `player_contact` - Contact info
   - `score` - Winning score
   - `won_at` - Timestamp when they won

## Installation Steps

### 1. Install XAMPP
Download and install XAMPP from: https://www.apachefriends.org/

XAMPP includes:
- Apache web server
- MySQL database
- PHP

### 2. Start XAMPP Services
Open XAMPP Control Panel and start:
- Apache (web server)
- MySQL (database)

### 3. Copy Project Files
Copy the `pushup-app` folder to XAMPP's `htdocs` directory:
```
C:\xampp\htdocs\pushup-app\          (Windows)
/Applications/XAMPP/htdocs/pushup-app/   (Mac)
/opt/lampp/htdocs/pushup-app/        (Linux)
```

### 4. Create Database
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Click "New" to create a database
3. Name it: `fitness_challenge`
4. Click "Create"
5. Select the database, then go to "SQL" tab
6. Copy and paste contents of `database/schema.sql`
7. Click "Go" to execute

**OR** Use MySQL command line:
```bash
mysql -u root -p
# Enter password (default is empty for XAMPP)

source C:/xampp/htdocs/pushup-app/database/schema.sql
# Or drag and drop the file path
```

### 5. Configure PHP Connection
Edit `/server/config.php` with your MySQL credentials:

For default XAMPP installation:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Empty for default XAMPP
define('DB_NAME', 'fitness_challenge');
```

### 6. Access the Application
Open your browser and navigate to:
- **Game**: http://localhost/pushup-app/index.html
- **Admin Panel**: http://localhost/pushup-app/admin.html

## Project Structure
```
pushup-app/
├── index.html              (Main game interface)
├── app.js                  (Game logic)
├── admin.html              (Admin dashboard)
├── admin.js                (Admin logic)
├── server/
│   ├── config.php          (Database configuration)
│   ├── api.php             (API endpoints)
│   └── .gitignore          (Git ignore file)
├── database/
│   ├── schema.sql          (Database schema)
│   └── README.md           (This file)
├── sup/
│   ├── angular.min.js
│   └── styles.css
├── img/
├── logo/
└── Icon/
```

## API Endpoints

All endpoints are accessed via: `./server/api.php?action={action_name}`

### Save Score
**POST** `/server/api.php?action=save_score`
```json
{
    "challenge_type": "pushup",
    "player_name": "John Doe",
    "player_contact": "1234567890",
    "score": 50
}
```

### Reset Leaderboard
**POST** `/server/api.php?action=reset_leaderboard`
```json
{
    "challenge_type": "pushup"
}
```
*Captures top 3 winners before resetting*

### Get All Data
**GET** `/server/api.php?action=get_all_data&challenge_type=all`

Returns all sessions, scores, and winners for admin panel.

### Get Active Session
**GET** `/server/api.php?action=get_active_session&challenge_type=pushup`

Returns current active session for a challenge.

## Admin Panel

Access at: `http://localhost/pushup-app/admin.html`

**Features:**
- View all sessions for each challenge
- Filter by specific challenge type
- See all player scores per session
- Winners highlighted with gold/silver/bronze gradients
- Color-coded active (green) vs completed (gray) sessions
- Auto-refresh every 30 seconds
- Fully responsive design

## Data Flow

1. **Player Plays Game** → Score submitted via app.js using AngularJS $http
2. **Score Saved** → PHP API (`api.php`) saves to `player_scores` table
3. **Leaderboard Reset** →
   - Top 3 players automatically saved to `session_winners`
   - Current session marked as "completed"
   - New session created and set as "active"
4. **Admin Views Data** → `admin.html` fetches from API and displays

## Backup Recommendations

### Using phpMyAdmin
1. Open phpMyAdmin
2. Select `fitness_challenge` database
3. Click "Export" tab
4. Choose "Quick" export method
5. Format: SQL
6. Click "Go" to download backup

### Automated Backup (Windows)
Create `backup.bat`:
```batch
@echo off
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%
"C:\xampp\mysql\bin\mysqldump" -u root fitness_challenge > "backup_%timestamp%.sql"
```

### Automated Backup (Linux/Mac)
Create `backup.sh`:
```bash
#!/bin/bash
mysqldump -u root fitness_challenge > backup_$(date +%Y%m%d).sql
```

Schedule with cron (Linux/Mac):
```bash
0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Apache Not Starting
- Check if port 80 is being used by another application
- Try changing Apache port in XAMPP (Config → httpd.conf)
- Disable Skype or other apps using port 80

### MySQL Not Starting
- Port 3306 might be in use
- Check if another MySQL service is running
- Stop other MySQL services and restart XAMPP

### Database Connection Failed
- Verify MySQL is running in XAMPP Control Panel
- Check credentials in `server/config.php`
- Ensure database `fitness_challenge` exists in phpMyAdmin
- Check MySQL error logs: `xampp/mysql/data/mysql_error.log`

### Data Not Saving
1. Open browser console (F12) for JavaScript errors
2. Check Network tab to see if API calls are successful
3. Verify PHP errors: Enable in `php.ini`:
   ```ini
   display_errors = On
   error_reporting = E_ALL
   ```
4. Check Apache error logs: `xampp/apache/logs/error.log`

### CORS Errors
The PHP `config.php` already includes CORS headers. If you still get CORS errors:
- Ensure you're accessing via http://localhost (not file://)
- Clear browser cache
- Check browser console for specific error messages

### Admin Panel Not Loading Data
1. Test API directly: http://localhost/pushup-app/server/api.php?action=get_all_data
2. Check browser Network tab for 404 or 500 errors
3. Verify Apache has read permissions on server/ folder
4. Check PHP MySQL extension is enabled in `php.ini`:
   ```ini
   extension=pdo_mysql
   extension=mysqli
   ```

## Testing the Setup

### Step-by-Step Test:

1. **Test Database Connection**
   ```
   http://localhost/pushup-app/server/api.php?action=get_all_data
   ```
   Should return JSON with sessions data

2. **Play a Game**
   - Open http://localhost/pushup-app/index.html
   - Select a challenge
   - Enter name and contact
   - Complete the challenge
   - Submit score

3. **Verify Data Saved**
   - Check phpMyAdmin → `player_scores` table
   - Should see your entry

4. **View Admin Panel**
   - Open http://localhost/pushup-app/admin.html
   - Should see your score listed

5. **Test Leaderboard Reset**
   - In game, click logo to access admin panel
   - Reset a specific leaderboard
   - Check phpMyAdmin → `session_winners` table
   - Top 3 should be captured

## Production Deployment

### Security Recommendations
1. **Change MySQL Password**
   - Use phpMyAdmin to change root password
   - Update `server/config.php`

2. **Disable Directory Listing**
   Add to `.htaccess`:
   ```apache
   Options -Indexes
   ```

3. **Restrict Admin Access**
   Protect `admin.html` with password authentication

4. **Enable HTTPS**
   - Get SSL certificate (Let's Encrypt)
   - Configure Apache for HTTPS

5. **Remove phpMyAdmin in Production**
   - Or protect it with strong authentication

### Recommended .htaccess
Create `.htaccess` in `pushup-app/` folder:
```apache
# Disable directory listing
Options -Indexes

# Protect server folder
<FilesMatch "\.php$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Optional: Protect admin.html
<Files "admin.html">
    AuthType Basic
    AuthName "Admin Area"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
</Files>
```

## Support
- XAMPP Documentation: https://www.apachefriends.org/docs/
- PHP Documentation: https://www.php.net/docs.php
- MySQL Documentation: https://dev.mysql.com/doc/

For project-specific issues, check the main README or contact the development team.
