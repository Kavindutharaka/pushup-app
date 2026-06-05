# Weekend Fitness Challenge - Kiosk Game

An interactive fitness challenge kiosk application built with AngularJS, HTML, and CSS.

## Features

### 5 Different Challenges:
1. **Pushup Challenge** - Count-up timer to track completion time
2. **Plank Challenge** - Count-up timer to track how long you hold
3. **Basketball Challenge** - 60-second countdown with shot counter
4. **Football Challenge** - 60-second countdown with shot counter
5. **Quick Reaction Challenge** - Manual stick catching counter

### Key Functionality:
- Player registration (name and contact)
- Real-time timers (count-up and count-down)
- Score tracking and submission
- Leaderboard with top 5 players per challenge
- LocalStorage persistence for leaderboard data
- Reset leaderboard functionality
- Full navigation between screens

## Technical Specifications

- **Display Size**: 1080 x 1920 pixels (Portrait kiosk mode)
- **Framework**: AngularJS 1.x
- **Typography System**:
  - Primary Font: **Archivo** (Buttons, player names, navigation, labels)
  - Secondary Font: **Sora** (Instructions, descriptions, helper text)
  - Display Font: **Bebas Neue** (Banners, titles, large numbers)
- **Color Theme**: Purple (#622467) with white and gold accents
- **Storage**: Browser LocalStorage for leaderboard data

## File Structure

```
pushup-app/
├── index.html          # Main HTML file with all views
├── app.js              # AngularJS controller and logic
├── sup/
│   ├── styles.css      # Custom CSS styling
│   └── angular.min.js  # AngularJS library
├── img/
│   └── logo.png        # Moov Advance logo
└── Icon/
    └── home.png        # Home navigation icon
```

## How to Run

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge)
2. For kiosk mode, set browser to fullscreen (F11)
3. Application is designed for 1080x1920 display resolution

## How to Play

1. **Select a Challenge**: Click on any of the 5 challenge buttons
2. **Choose Action**:
   - Start Challenge
   - See Player Data (Leaderboard)
   - Reset Leaderboard
3. **Register**: Enter your name and contact number
4. **Compete**: Complete the challenge
5. **Submit Score**: Enter/confirm your score
6. **View Results**: See your ranking on the leaderboard

## Challenge Details

### Pushup Challenge
- Timer counts up from 00:00
- Click "END CHALLENGE" when finished
- Enter completion time in seconds

### Plank Challenge
- Timer counts up from 0 seconds
- Click "END CHALLENGE" when you can't hold anymore
- Time is automatically recorded

### Basketball Challenge
- 60-second countdown timer
- Click "+" button for each successful shot
- Automatically ends when timer reaches 0

### Football Challenge
- 60-second countdown timer
- Click "+" button for each successful shot
- Automatically ends when timer reaches 0

### Quick Reaction Challenge
- No timer
- Click "CATCH" button for each stick caught
- Click "END CHALLENGE" when finished

## Data Storage

The game is **online**. All scores, sessions and winners are stored on a remote
Microsoft SQL Server, accessed directly from AngularJS (`$http`) through a generic
SQL endpoint — no PHP/back-end of our own is required:

```
POST https://mas.phvtech.com/api/Master/sp
Content-Type: application/json
{ "SysID": "<T-SQL statement>" }   ->   [ {row}, ... ]
```

All database access is centralised in `sup/db-service.js` (the shared `MoovDB`
AngularJS module / `DB` service). Tables used (see `database/schema_sqlserver.sql`):
- `moov_fit_sessions` — one row per round; a "reset" completes the active session
- `moov_fit_scores` — every player attempt
- `moov_fit_winners` — top 3 captured each time a leaderboard is reset (1 cup each)

The live on-screen leaderboard still uses browser LocalStorage for instant display
(`leaderboard_pushup`, `leaderboard_plank`, `leaderboard_basketball`,
`leaderboard_football`, `leaderboard_quickreaction`), but every score is also
written to the online database.

> The old offline MySQL/PHP back-end (`server/api.php`, `server/config.php`,
> `database/schema.sql`) is no longer used.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## Notes

- This application is optimized for kiosk displays
- Touch-friendly button sizes for interactive displays
- An internet connection is required (scores are saved to the online database)
- Data is stored online in SQL Server; LocalStorage is used only for instant display
