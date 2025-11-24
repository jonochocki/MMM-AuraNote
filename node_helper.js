/* MagicMirror²
 * Node Helper: MMM-AuraNote
 *
 * By Jon Lebron
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    start: function () {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "AURA_NOTE_BROADCAST") {
            // Broadcast notification to all connected clients
            this.sendSocketNotification("AURA_NOTE_RECEIVE", payload);
        }
    }
});
