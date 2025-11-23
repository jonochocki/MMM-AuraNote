/* Example MagicMirror Test Module to Send Notifications to MMM-AuraNote
 * 
 * This is a simple test module that sends various notifications to MMM-AuraNote.
 * Place this in your MagicMirror modules folder to test the notification system.
 * 
 * Usage in config.js:
 * {
 *     module: "MMM-AuraNote-Test",
 *     position: "top_left"
 * }
 */

Module.register("MMM-AuraNote-Test", {
    defaults: {},

    start: function () {
        Log.info("Starting module: " + this.name);

        // Send test notifications at intervals
        setTimeout(() => {
            this.sendTestNotifications();
        }, 3000); // Wait 3 seconds for module to load
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = "AuraNote Test Module";
        wrapper.style.fontSize = "12px";
        wrapper.style.opacity = "0.5";
        return wrapper;
    },

    sendTestNotifications: function () {
        // Test 1: Simple notification
        this.sendNotification("AURA_NOTE_SHOW", {
            content: "Welcome to MagicMirror with AuraNote!"
        });

        // Test 2: Timed notification (after 5 seconds)
        setTimeout(() => {
            this.sendNotification("AURA_NOTE_SHOW", {
                content: "This notification will auto-dismiss in 5 seconds",
                timer: 5000
            });
        }, 5000);

        // Test 3: Critical alert (after 10 seconds)
        setTimeout(() => {
            this.sendNotification("AURA_NOTE_SHOW", {
                content: "⚠️ Critical Alert Example",
                isCritical: true
            });
        }, 10000);

        // Test 4: Rich HTML notification with button (after 15 seconds)
        setTimeout(() => {
            this.sendNotification("AURA_NOTE_SHOW", {
                content: `
                    <h3 style="margin: 0 0 8px 0;">Rich Notification</h3>
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                        This notification includes custom HTML and an action button.
                    </p>
                `,
                isHTML: true,
                buttonLabel: "Learn More",
                buttonUrl: "https://github.com/MichMich/MagicMirror",
                timer: 15000
            });
        }, 15000);

        // Test 5: Multiple notifications (after 20 seconds)
        setTimeout(() => {
            this.sendNotification("AURA_NOTE_SHOW", {
                content: "First bubble"
            });

            setTimeout(() => {
                this.sendNotification("AURA_NOTE_SHOW", {
                    content: "Second bubble"
                });
            }, 500);

            setTimeout(() => {
                this.sendNotification("AURA_NOTE_SHOW", {
                    content: "Third bubble"
                });
            }, 1000);
        }, 20000);
    }
});
