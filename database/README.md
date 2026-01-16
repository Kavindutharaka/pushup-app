# Weekend Fitness Challenge - Database Setup

## Overview
This system tracks all player data, scores, and session winners using MySQL database.

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

### 1. Install MySQL
```bash
# On Ubuntu/Debian
sudo apt-get install mysql-server

# On Windows: Download from https://dev.mysql.com/downloads/installer/
# On Mac: brew install mysql
```

### 2. Create Database and Tables
```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source /path/to/pushup-app/database/schema.sql

# Or copy-paste the contents of schema.sql into MySQL prompt
```

### 3. Configure PHP Connection
Edit `/server/config.php` with your MySQL credentials:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_mysql_password');
define('DB_NAME', 'fitness_challenge');
```

### 4. Install PHP (if not already installed)
```bash
# On Ubuntu/Debian
sudo apt-get install php php-mysql

# On Windows: Install XAMPP or WAMP
# On Mac: PHP is pre-installed, or brew install php
```

### 5. Start PHP Server
```bash
# Navigate to project directory
cd /path/to/pushup-app

# Start PHP built-in server
php -S localhost:8000

# Or use Apache/Nginx with proper configuration
```

### 6. Test the Setup
1. Open the game: `http://localhost:8000/index.html`
2. Play a challenge and submit a score
3. Open admin panel: `http://localhost:8000/admin.html`
4. Verify data appears in the admin panel

## API Endpoints

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

Returns all sessions, scores, and winners.

## Admin Panel

Access the admin panel at: `http://localhost:8000/admin.html`

**Features:**
- View all sessions for each challenge
- Filter by specific challenge
- See all player scores per session
- Winners highlighted with gold/silver/bronze
- Color-coded active/completed sessions
- Auto-refresh every 30 seconds
- Responsive design for mobile/tablet

## Data Flow

1. **Player Plays Game** → Score submitted via app.js
2. **Score Saved** → PHP API saves to `player_scores` table
3. **Leaderboard Reset** →
   - Top 3 players saved to `session_winners`
   - Current session marked as "completed"
   - New session created and set as "active"
4. **Admin Views Data** → admin.html fetches all data and displays

## Backup Recommendations

### Automated Backup Script
```bash
#!/bin/bash
mysqldump -u root -p fitness_challenge > backup_$(date +%Y%m%d).sql
```

Run daily via cron:
```bash
0 2 * * * /path/to/backup_script.sh
```

## Troubleshooting

### Connection Failed
- Check MySQL is running: `sudo service mysql status`
- Verify credentials in `/server/config.php`
- Check PHP MySQL extension: `php -m | grep mysql`

### Data Not Saving
- Check browser console for errors
- Verify API URL in `app.js` and `admin.js`
- Test API directly: `curl http://localhost:8000/server/api.php?action=get_all_data`

### Admin Panel Not Loading
- Check PHP errors: `tail -f /var/log/apache2/error.log`
- Verify CORS headers in config.php
- Check network tab in browser developer tools

## Production Deployment

### Security Recommendations
1. Change default MySQL password
2. Use environment variables for credentials
3. Enable HTTPS
4. Restrict API access
5. Add input validation and sanitization
6. Use prepared statements (already implemented)

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName fitness.yourdomain.com
    DocumentRoot /var/www/pushup-app

    <Directory /var/www/pushup-app>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## Support
For issues or questions, check the main project README or contact the development team.
