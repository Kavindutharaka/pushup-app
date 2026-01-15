# Logo Assets

This folder contains challenge-specific identification logos for the Weekend Fitness Challenge kiosk game.

## Required Logo Files

Place the following logo image files in this directory:

### Challenge-Specific Identification Icons
- **pushup&plank.png** - Icon for both Pushup and Plank challenges
- **basketball.png** - Icon for Basketball challenge
- **football.png** - Icon for Football challenge
- **quick_reaction .png** - Icon for Quick Reaction challenge *(note: filename has a space before .png)*

## Logo Structure

### Brand Logo (Always Displayed)
The main Moov Advance brand logo is located at `img/logo.png` and appears on **ALL screens** at the top.

### Challenge Icons (Additional Visual Elements)
Challenge-specific icons from this folder appear as **additional decorative elements** below the header to help users identify which challenge they're viewing.

## Logo Usage by Screen

| Screen | Brand Logo | Challenge Icon |
|--------|-----------|----------------|
| **Home Screen** | ✓ `img/logo.png` (top) | ✗ None |
| **Challenge Menu** | ✓ `img/logo.png` (top) | ✓ Below header |
| **Registration** | ✓ `img/logo.png` (top) | ✓ Below header |
| **Active Challenge** | ✓ `img/logo.png` (top) | ✓ Below header |
| **Result Screen** | ✓ `img/logo.png` (top) | ✓ Below header |
| **Leaderboard** | ✓ `img/logo.png` (top) | ✓ Below header |

## Visual Hierarchy

```
┌─────────────────────────────┐
│  Moov Advance Brand Logo    │ ← Always shown (img/logo.png)
│  (img/logo.png)             │
├─────────────────────────────┤
│  WEEKEND FITNESS CHALLENGE  │ ← Header text
├─────────────────────────────┤
│  [Challenge Icon]           │ ← Challenge-specific icon (logo/xxx.png)
│  (basketball/football/etc)  │
├─────────────────────────────┤
│  BASKETBALL CHALLENGE       │ ← Challenge title
│  ...rest of content...      │
└─────────────────────────────┘
```

## Recommended Specifications

- Format: PNG with transparent background
- Recommended width: 350-400px
- Aspect ratio: Maintain original Moov Advance logo proportions
- File size: Optimize for web (< 200KB per image)

## Notes

All logos should follow the Moov Advance brand guidelines with the orange circle element and italic text styling.
