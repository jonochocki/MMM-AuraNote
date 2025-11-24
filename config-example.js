/* Example MagicMirror Configuration for MMM-AuraNote
 * 
 * Copy this into your config/config.js modules array
 * 
 * IMPORTANT: Place MMM-AuraNote as one of the FIRST modules in your config
 * so it loads early and can receive notifications from other modules.
 */

// Basic Configuration (fullscreen background)
{
    module: "MMM-AuraNote",
        position: "fullscreen_below",
            config: {
        showBackground: true,
            defaultDarkMode: true,
                allowManualDismiss: true,
                // interceptNotifications: false,  // Uncomment to replace default MM notifications
                // syncAcrossInstances: false      // Uncomment to sync across all clients
    }
},


// Alternative Configuration (bottom center)
// {
//     module: "MMM-AuraNote",
//     position: "bottom_center",
//     config: {
//         showBackground: true,
//         defaultDarkMode: true,
//         allowManualDismiss: true,
//         defaultTimer: 10000  // Auto-dismiss after 10 seconds by default
//     }
// },

// Configuration with Custom Physics
// {
//     module: "MMM-AuraNote",
//     position: "fullscreen_below",
//     config: {
//         showBackground: true,
//         defaultDarkMode: false,  // Light mode
//         allowManualDismiss: true,
//         physicsConfig: {
//             attractionStrength: 0.001,    // Stronger center pull
//             repulsionStrength: 5000,      // More bubble spacing
//             damping: 0.92,                // Faster settling
//             activeSpeed: 3.0              // Faster animations
//         }
//     }
// },

// Optional: Add test module to try out notifications
// {
//     module: "MMM-AuraNote-Test",
//     position: "top_left"
// }
