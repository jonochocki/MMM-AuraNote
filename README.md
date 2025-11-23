# MMM-AuraNote

A beautiful MagicMirror² module for displaying alerts and notifications with Apple Intelligence-style glow animations, physics-based bubble movement, and critical alert styling.

![MMM-AuraNote Demo](demo.gif)

## Features

- 🌈 **Apple Intelligence-Style Glow Background** - Animated mesh gradient at the bottom of the screen using Apple system colors
- 🫧 **Physics-Based Bubbles** - Notifications appear as floating bubbles with organic oil-in-water movement
- ⚡ **Critical Alerts** - Pulsating white glow for important notifications with automatic spacing
- ⏱️ **Auto-Dismiss Timers** - Circular progress border for timed notifications
- 🎨 **Dark & Light Modes** - Automatic dark mode support with customizable styling
- 🔘 **CTA Buttons** - Optional action buttons within notifications
- 📱 **Rich HTML Content** - Support for custom HTML in notifications
- 🎯 **Click to Dismiss** - Manual dismissal option

## Installation

1. Navigate to your MagicMirror's `modules` folder:
   ```bash
   cd ~/MagicMirror/modules
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/jonochocki/MMM-AuraNote.git
   ```

3. Add the module to your `config/config.js` file (see configuration below)

## Configuration

Add the following to your `config/config.js`:

```javascript
{
    module: "MMM-AuraNote",
    position: "fullscreen_below", // Recommended: fullscreen_below or bottom_center
    config: {
        showBackground: true,        // Show animated glow background
        defaultDarkMode: true,        // Start in dark mode
        allowManualDismiss: true,     // Allow clicking bubbles to dismiss
        defaultTimer: null,           // Default auto-dismiss timer (ms), null = no timer
    }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showBackground` | Boolean | `true` | Display the animated glow background |
| `defaultDarkMode` | Boolean | `true` | Use dark mode styling for bubbles |
| `allowManualDismiss` | Boolean | `true` | Allow users to click bubbles to dismiss them |
| `defaultTimer` | Number/null | `null` | Default auto-dismiss timer in milliseconds (null = no timer) |
| `physicsConfig` | Object | See below | Advanced physics engine configuration |

### Advanced Physics Configuration

```javascript
physicsConfig: {
    attractionStrength: 0.0005,     // Center attraction force
    repulsionStrength: 4000,        // Bubble repulsion force
    damping: 0.94,                  // Velocity damping
    noiseStrength: 0.05,            // Organic movement noise
    baseSpeed: 0.1,                 // Minimum movement speed
    activeSpeed: 2.5,               // Speed when system is active
    tempDecay: 0.96,                // Temperature decay rate
    maxOverlap: 0.05,               // Allowed bubble overlap (5%)
    hardCollisionForce: 1.0,        // Collision separation force
    boundaryPadding: 20             // Screen edge padding (px)
}
```

## Usage

### Sending Notifications from Other Modules

Other MagicMirror modules can send notifications to MMM-AuraNote:

```javascript
this.sendNotification("AURA_NOTE_SHOW", {
    content: "Your notification message",
    isHTML: false,                  // Set to true for HTML content
    timer: 5000,                    // Auto-dismiss after 5 seconds (optional)
    buttonLabel: "Learn More",      // CTA button text (optional)
    buttonUrl: "https://example.com", // CTA button URL (optional)
    isCritical: false               // Critical alert styling (optional)
});
```

### Notification Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | String | Yes | The notification message (supports HTML if `isHTML` is true) |
| `isHTML` | Boolean | No | Whether content contains HTML markup |
| `timer` | Number | No | Auto-dismiss timer in milliseconds |
| `buttonLabel` | String | No | Text for action button (requires `buttonUrl`) |
| `buttonUrl` | String | No | URL for action button (requires `buttonLabel`) |
| `isCritical` | Boolean | No | Display as critical alert with pulsating glow |

### Examples

#### Simple Text Notification
```javascript
this.sendNotification("AURA_NOTE_SHOW", {
    content: "Hello from MagicMirror!"
});
```

#### Timed Notification
```javascript
this.sendNotification("AURA_NOTE_SHOW", {
    content: "This will disappear in 10 seconds",
    timer: 10000
});
```

#### Critical Alert
```javascript
this.sendNotification("AURA_NOTE_SHOW", {
    content: "⚠️ Important Alert!",
    isCritical: true
});
```

#### Rich HTML Notification with Button
```javascript
this.sendNotification("AURA_NOTE_SHOW", {
    content: `
        <h3 style="margin: 0 0 8px 0;">New Update Available</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Version 2.0 is ready to install
        </p>
    `,
    isHTML: true,
    buttonLabel: "Update Now",
    buttonUrl: "https://github.com/yourusername/your-module",
    timer: 15000
});
```

#### Clear All Notifications
```javascript
this.sendNotification("AURA_NOTE_CLEAR");
```

## Recommended Positions

While MMM-AuraNote can be placed in any position, it works best in:

- `fullscreen_below` - **Recommended** - Full screen background with bubbles at the bottom
- `bottom_center` - Glow and bubbles at bottom center
- `lower_third` - Bottom third of the screen

> **Note:** When using `fullscreen_below`, the glow background will cover the entire screen while bubbles remain at the bottom.

## Styling

The module uses Apple system colors for the glow animation:
- Orange (`#FF9500`)
- Yellow (`#FFCC00`)
- Red (`#FF3B30`)
- Pink (`#FF2D55`)
- Blue (`#007AFF`)
- Purple (`#AF52DE`)

You can customize the appearance by editing `MMM-AuraNote.css`.

## Development

### Console API for Testing

When MagicMirror is running, you can test notifications directly from your browser console:

```javascript
// Show help for available commands
AuraNote.help()

// Simple test notification
AuraNote.test()
AuraNote.test("Hello World")

// Critical alert (no auto-dismiss)
AuraNote.critical("⚠️ Important Alert!")

// Timed notification (auto-dismiss in seconds)
AuraNote.timed("This will disappear in 10 seconds", 10)

// Advanced options
AuraNote.test("Custom notification", {
    isHTML: false,
    timer: 5000,
    buttonLabel: "Learn More",
    buttonUrl: "https://example.com",
    isCritical: false
})

// Rich HTML content
AuraNote.test(`
    <h3 style="margin: 0 0 8px 0;">New Update</h3>
    <p style="margin: 0; opacity: 0.8;">Version 2.0 available</p>
`, { isHTML: true, timer: 10000 })

// Clear all notifications
AuraNote.clear()
```

## Performance Considerations

- The physics engine runs at 60 FPS using `requestAnimationFrame`
- Multiple bubbles are efficiently managed with collision detection
- The module automatically suspends physics when MagicMirror is suspended

## Credits

- Inspired by Apple Intelligence Siri glow design
- Uses custom physics engine for organic bubble movement
- Created for MagicMirror² by Jon Lebron

## License

MIT Licensed. See LICENSE file for details.

## Changelog

### Version 1.0.0 (Initial Release)
- Apple Intelligence-style glow background
- Physics-based bubble animations
- Critical alert support with pulsating glow
- Auto-dismiss timers with visual progress
- Dark/light mode support
- CTA button support
- Rich HTML content support
- Manual dismiss capability

## Support

For issues, feature requests, or questions, please visit:
https://github.com/jonochocki/MMM-AuraNote/issues
