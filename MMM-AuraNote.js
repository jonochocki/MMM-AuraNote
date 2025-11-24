/* MagicMirror²
 * Module: MMM-AuraNote
 *
 * By Jon Lebron
 * MIT Licensed.
 */

Module.register("MMM-AuraNote", {
    // Default module config
    defaults: {
        showBackground: true,        // Show animated glow background
        defaultDarkMode: true,        // Start in dark mode
        allowManualDismiss: true,     // Allow clicking bubbles to dismiss
        defaultTimer: null,           // Default auto-dismiss timer (ms), null = no timer
        interceptNotifications: false, // Intercept default MM notifications
        syncAcrossInstances: false,   // Sync notifications across all clients
        physicsConfig: {
            attractionStrength: 0.0005,
            repulsionStrength: 4000,
            damping: 0.94,
            noiseStrength: 0.05,
            baseSpeed: 0.1,
            activeSpeed: 2.5,
            tempDecay: 0.96,
            maxOverlap: 0.05,
            hardCollisionForce: 1.0,
            boundaryPadding: 20
        },
        highPerformance: false // Disable expensive effects like backdrop-filter
    },

    // Module state
    bubbles: [],
    systemTemperature: 0,
    bubbles: [],
    systemTemperature: 0,
    animationFrameId: null,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,

    // Required version
    requiresVersion: "2.1.0",

    start: function () {
        Log.info("Starting module: " + this.name);
        Log.info("MMM-AuraNote Config:", this.config);
        this.isDarkMode = this.config.defaultDarkMode;

        // Generate unique ID for this instance to prevent self-broadcasting loops
        this.instanceId = "aura-" + Math.random().toString(36).substr(2, 9);
        Log.info("MMM-AuraNote Instance ID:", this.instanceId);

        // Intercept default MagicMirror notifications if enabled
        if (this.config.interceptNotifications) {
            Log.info("MMM-AuraNote: Interception ENABLED");
            this.interceptNotifications();
        } else {
            Log.info("MMM-AuraNote: Interception DISABLED");
        }

        // Expose global console API for testing
        window.AuraNote = {
            test: (content, options = {}) => {
                this.createBubble(
                    content || "Test notification from console",
                    options.isHTML || false,
                    options.timer !== undefined ? options.timer : 5000,
                    options.buttonLabel || null,
                    options.buttonUrl || null,
                    options.isCritical || false,
                    true // shouldBroadcast
                );
                console.log("✅ AuraNote notification created:", content);
            },
            clear: () => {
                this.clearAllBubbles();
                console.log("✅ All AuraNote notifications cleared");
            },
            critical: (content) => {
                window.AuraNote.test(content, { isCritical: true, timer: null });
            },
            timed: (content, seconds = 5) => {
                window.AuraNote.test(content, { timer: seconds * 1000 });
            },
            help: () => {
                console.log(`
🎯 AuraNote Console API:

Basic usage:
  AuraNote.test()                           // Simple test notification
  AuraNote.test("Hello World")              // Custom message
  
Advanced usage:
  AuraNote.test("Message", {                // Full options
    isHTML: false,                          // Set true for HTML content
    timer: 5000,                            // Auto-dismiss in ms
    buttonLabel: "Learn More",              // CTA button text
    buttonUrl: "https://example.com",       // CTA button URL
    isCritical: false                       // Critical alert styling
  })

Quick shortcuts:
  AuraNote.critical("⚠️ Alert!")            // Critical alert (no timer)
  AuraNote.timed("Message", 10)             // Auto-dismiss in 10 seconds
  AuraNote.clear()                          // Clear all notifications

Examples:
  AuraNote.test("Simple notification")
  AuraNote.critical("⚠️ Important Alert!")
  AuraNote.timed("Disappears in 3 sec", 3)
  AuraNote.test("<h3>Rich HTML</h3>", { isHTML: true })
                `);
            }
        };

        console.log("🌟 AuraNote loaded! Type 'AuraNote.help()' for console API info");
    },

    interceptNotifications: function () {
        Log.info("MMM-AuraNote: Intercepting default notifications");
        // Add class to body to hide default notifications
        document.body.classList.add("MMM-AuraNote-intercept");
    },

    // Define styles
    getStyles: function () {
        return ["MMM-AuraNote.css"];
    },

    // Override dom generator
    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-AuraNote";

        // Create glow background container
        if (this.config.showBackground) {
            const glowContainer = document.createElement("div");
            glowContainer.className = "glow-container";

            for (let i = 1; i <= 7; i++) {
                const blob = document.createElement("div");
                blob.className = `glow-blob blob-${i}`;
                glowContainer.appendChild(blob);
            }

            const overlay = document.createElement("div");
            overlay.className = "glow-overlay";
            glowContainer.appendChild(overlay);

            wrapper.appendChild(glowContainer);
        }

        // Create message container
        const messageContainer = document.createElement("div");
        messageContainer.className = "message-container";
        messageContainer.id = "aura-message-container";
        wrapper.appendChild(messageContainer);

        if (this.config.highPerformance) {
            wrapper.classList.add("performance-mode");
            Log.info("MMM-AuraNote: High Performance Mode ENABLED");
        }

        return wrapper;
    },

    notificationReceived: function (notification, payload, sender) {
        // Log ALL notifications for debugging
        if (notification !== "CLOCK_SECOND" && notification !== "NEWS_FEED_NEXT_ITEM") {
            Log.info(`MMM-AuraNote received: ${notification}`, payload);
        }

        if (notification === "DOM_OBJECTS_CREATED") {
            this.messageContainer = document.getElementById("aura-message-container");
            // Start physics loop
            // Start physics loop
            this.startPhysicsLoop();

            // Cache window dimensions on resize
            window.addEventListener('resize', () => {
                this.windowWidth = window.innerWidth;
                this.windowHeight = window.innerHeight;
            });
        }

        // Intercept System Notifications
        if (this.config.interceptNotifications) {
            if (notification === "SHOW_ALERT") {
                Log.info("MMM-AuraNote: Intercepting SHOW_ALERT");
                // Handle Alert (Critical)
                const title = payload.title ? `<strong>${payload.title}</strong><br>` : "";
                const message = payload.message || "";
                this.createBubble(
                    title + message,
                    true, // isHTML
                    payload.timer, // Use payload timer (was null)
                    null, // buttonLabel
                    null, // buttonUrl
                    true, // critical
                    true  // shouldBroadcast
                );
                return;
            }

            // Handle Standard Notifications (some modules use SHOW_NOTIFICATION)
            if (notification === "SHOW_NOTIFICATION") {
                Log.info("MMM-AuraNote: Intercepting SHOW_NOTIFICATION");
                const title = payload.title ? `<strong>${payload.title}</strong><br>` : "";
                const message = payload.message || "";
                this.createBubble(
                    title + message,
                    true, // isHTML
                    payload.timer || 5000,
                    null, // buttonLabel
                    null, // buttonUrl
                    false, // not critical
                    true  // shouldBroadcast
                );
                return;
            }
        }

        // Listen for AURA_NOTE_SHOW notifications from other modules
        if (notification === "AURA_NOTE_SHOW" && payload) {
            this.createBubble(
                payload.content || "Notification",
                payload.isHTML || false,
                payload.timer !== undefined ? payload.timer : this.config.defaultTimer,
                payload.buttonLabel || null,
                payload.buttonUrl || null,
                payload.isCritical || false,
                true // shouldBroadcast
            );
        }

        // Listen for AURA_NOTE_CLEAR to dismiss all bubbles
        if (notification === "AURA_NOTE_CLEAR") {
            this.clearAllBubbles();
        }
    },

    socketNotificationReceived: function (notification, payload) {
        // Handle broadcasts from node helper (for cross-instance sync)
        if (notification === "AURA_NOTE_RECEIVE") {
            // Ignore our own broadcasts
            if (payload.senderId === this.instanceId) {
                return;
            }

            Log.info("MMM-AuraNote: Received broadcast notification from " + payload.senderId);
            // Create bubble from broadcast (don't re-broadcast to prevent infinite loop)
            this.createBubble(
                payload.content,
                payload.isHTML,
                payload.timer,
                payload.buttonLabel,
                payload.buttonUrl,
                payload.isCritical,
                false, // don't broadcast again
                payload.id // Use synced ID
            );
        }

        if (notification === "AURA_NOTE_RECEIVE_CLEAR") {
            if (payload.senderId === this.instanceId) return;
            Log.info("MMM-AuraNote: Received broadcast CLEAR from " + payload.senderId);
            this.clearAllBubbles(false); // Clear locally without broadcasting
        }

        if (notification === "AURA_NOTE_RECEIVE_DISMISS") {
            if (payload.senderId === this.instanceId) return;
            Log.info("MMM-AuraNote: Received broadcast DISMISS for " + payload.id);
            // Find bubble with this ID
            const bubble = this.bubbles.find(b => b.id === payload.id);
            if (bubble) {
                this.dismissBubble(bubble, false); // Dismiss locally without broadcasting
            }
        }
    },


    createBubble: function (content, isHTML, timer, buttonLabel, buttonUrl, isCritical, shouldBroadcast = false, id = null) {
        if (!this.messageContainer) {
            Log.error("Message container not ready");
            return;
        }

        // Generate ID if not provided
        const bubbleId = id || (Date.now() + Math.random());

        // Broadcast to other instances if sync is enabled and shouldBroadcast is true
        if (this.config.syncAcrossInstances && shouldBroadcast) {
            Log.info("MMM-AuraNote: Broadcasting bubble to other instances");
            this.sendSocketNotification("AURA_NOTE_BROADCAST", {
                id: bubbleId, // Sync the ID
                content: content,
                isHTML: isHTML,
                timer: timer,
                buttonLabel: buttonLabel,
                buttonUrl: buttonUrl,
                isCritical: isCritical,
                senderId: this.instanceId
            });
        } else if (shouldBroadcast && !this.config.syncAcrossInstances) {
            Log.info("MMM-AuraNote: Skipping broadcast (syncAcrossInstances is disabled)");
        }

        const element = document.createElement('div');
        element.classList.add('message-bubble');

        if (isHTML) {
            element.innerHTML = content;
            element.classList.add('rich-bubble');
        } else {
            element.textContent = content;
        }

        // Add CTA button if both label and URL are provided
        if (buttonLabel && buttonUrl) {
            const button = document.createElement('button');
            button.className = 'bubble-cta';
            button.textContent = buttonLabel;
            button.onclick = (e) => {
                e.stopPropagation();
                window.open(buttonUrl, '_blank');
            };
            element.appendChild(button);
        }

        // Add critical styling if marked as critical
        if (isCritical) {
            element.classList.add('critical-bubble');
        }

        if (this.isDarkMode) {
            element.classList.add('dark-mode');
        }

        // Random initial position near center
        const initialX = (Math.random() - 0.5) * 50;
        const initialY = (Math.random() - 0.5) * 50;

        const bubble = {
            id: bubbleId,
            element: element,
            x: initialX,
            y: initialY,
            vx: 0,
            vy: 0,
            width: 0,
            height: 0,
            radius: 0,
            isCritical: isCritical
        };

        // Add click to dismiss
        if (this.config.allowManualDismiss) {
            element.addEventListener('click', () => {
                this.dismissBubble(bubble);
            });
        }

        this.messageContainer.appendChild(element);
        this.bubbles.push(bubble);

        // ResizeObserver
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                bubble.width = entry.target.offsetWidth;
                bubble.height = entry.target.offsetHeight;
                bubble.radius = (bubble.width + bubble.height) / 4;

                if (bubble.timerSvg) {
                    this.updateTimerSvgSize(bubble);
                }

                this.spikeTemperature();
            }
        });
        resizeObserver.observe(element);
        bubble.resizeObserver = resizeObserver;

        requestAnimationFrame(() => {
            element.classList.add('show');
        });

        // Add timer if specified
        if (timer && timer > 0) {
            this.startBorderTimer(bubble, timer);
        }

        this.spikeTemperature();
    },

    dismissBubble: function (bubbleToRemove, shouldBroadcast = true) {
        const index = this.bubbles.findIndex(b => b.id === bubbleToRemove.id);
        if (index > -1) {
            const bubble = this.bubbles[index];

            // Broadcast dismissal
            if (this.config.syncAcrossInstances && shouldBroadcast) {
                this.sendSocketNotification("AURA_NOTE_BROADCAST_DISMISS", {
                    id: bubble.id,
                    senderId: this.instanceId
                });
            }

            if (bubble.resizeObserver) {
                bubble.resizeObserver.disconnect();
            }

            if (bubble.timerTimeout) {
                clearTimeout(bubble.timerTimeout);
            }

            bubble.element.classList.remove('show');
            bubble.element.classList.add('hide');

            this.bubbles.splice(index, 1);
            this.spikeTemperature();

            bubble.element.addEventListener('transitionend', () => {
                if (bubble.element.parentElement) {
                    bubble.element.parentElement.removeChild(bubble.element);
                }
            }, { once: true });
        }
    },

    clearAllBubbles: function (shouldBroadcast = true) {
        // Broadcast clear all
        if (this.config.syncAcrossInstances && shouldBroadcast) {
            this.sendSocketNotification("AURA_NOTE_BROADCAST_CLEAR", {
                senderId: this.instanceId
            });
        }

        // Dismiss all bubbles
        const bubblesToRemove = [...this.bubbles];
        bubblesToRemove.forEach(bubble => this.dismissBubble(bubble, false)); // Don't broadcast individual dismissals when clearing all
    },

    spikeTemperature: function () {
        this.systemTemperature = 1.0;
    },

    updateTimerSvgSize: function (bubble) {
        const width = bubble.element.offsetWidth;
        const height = bubble.element.offsetHeight;
        const padding = 6;
        const strokeWidth = 3;

        const svgWidth = width + (padding * 2) + strokeWidth;
        const svgHeight = height + (padding * 2) + strokeWidth;

        bubble.timerSvg.setAttribute('width', svgWidth);
        bubble.timerSvg.setAttribute('height', svgHeight);

        const rectWidth = width + (padding * 2);
        const rectHeight = height + (padding * 2);
        const rectX = strokeWidth / 2;
        const rectY = strokeWidth / 2;
        const borderRadius = 24 + padding;

        bubble.timerRect.setAttribute('x', rectX);
        bubble.timerRect.setAttribute('y', rectY);
        bubble.timerRect.setAttribute('width', rectWidth);
        bubble.timerRect.setAttribute('height', rectHeight);
        bubble.timerRect.setAttribute('rx', borderRadius);
        bubble.timerRect.setAttribute('ry', borderRadius);

        const perimeter = 2 * (rectWidth + rectHeight) - 8 * borderRadius + 2 * Math.PI * borderRadius;
        bubble.perimeter = perimeter; // Cache perimeter for animation loop
        bubble.timerRect.style.strokeDasharray = perimeter;

        if (bubble.timerStartTime) {
            const elapsed = Date.now() - bubble.timerStartTime;
            const progress = Math.min(elapsed / bubble.timerDuration, 1);
            const offset = perimeter * (1 - progress);
            bubble.timerRect.style.strokeDashoffset = offset;
        }
    },

    startBorderTimer: function (bubble, duration) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('timer-svg');

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('timer-border');

        svg.appendChild(rect);
        bubble.element.appendChild(svg);

        bubble.timerSvg = svg;
        bubble.timerRect = rect;
        bubble.timerDuration = duration;
        bubble.timerStartTime = Date.now();

        this.updateTimerSvgSize(bubble);
        // Animation is now handled in the main physics loop

        bubble.timerTimeout = setTimeout(() => {
            this.dismissBubble(bubble);
        }, duration);
    },

    // animateTimer removed - logic moved to updatePhysics

    startPhysicsLoop: function () {
        const updatePhysics = () => {
            const cfg = this.config.physicsConfig;
            this.systemTemperature *= cfg.tempDecay;
            const currentSpeedFactor = cfg.baseSpeed + (cfg.activeSpeed - cfg.baseSpeed) * this.systemTemperature;

            // Use cached dimensions
            const containerX = this.windowWidth / 2;
            const containerY = this.windowHeight * 0.8;

            const now = Date.now();

            for (let i = 0; i < this.bubbles.length; i++) {
                const b1 = this.bubbles[i];

                // --- TIMER ANIMATION UPDATE ---
                if (b1.timerRect && b1.timerStartTime) {
                    const elapsed = now - b1.timerStartTime;
                    const progress = Math.min(elapsed / b1.timerDuration, 1);

                    // Only update DOM if changed significantly or finished
                    if (progress <= 1) {
                        // We need to recalculate perimeter if size changed, but for now assume updateTimerSvgSize handles resizes.
                        // To be safe and performant, we use the values from the last resize/init.
                        // However, we need the perimeter. Let's store it on the bubble during resize/init.
                        if (!b1.perimeter) {
                            // Fallback calculation if not yet set
                            const padding = 6;
                            const borderRadius = 24 + padding;
                            const rectWidth = b1.width + (padding * 2);
                            const rectHeight = b1.height + (padding * 2);
                            b1.perimeter = 2 * (rectWidth + rectHeight) - 8 * borderRadius + 2 * Math.PI * borderRadius;
                        }

                        const offset = b1.perimeter * (1 - progress);
                        b1.timerRect.style.strokeDashoffset = offset;
                    }
                }
                // ------------------------------

                // 1. Attraction to Center
                b1.vx -= b1.x * cfg.attractionStrength * currentSpeedFactor;
                b1.vy -= b1.y * cfg.attractionStrength * currentSpeedFactor;

                // 2. Repulsion & Collision
                for (let j = 0; j < this.bubbles.length; j++) {
                    if (i === j) continue;
                    const b2 = this.bubbles[j];

                    const dx = b1.x - b2.x;
                    const dy = b1.y - b2.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);

                    if (dist < 0.1) continue;

                    // Soft Repulsion
                    const repulsionForce = (cfg.repulsionStrength / distSq) * currentSpeedFactor;
                    b1.vx += (dx / dist) * repulsionForce;
                    b1.vy += (dy / dist) * repulsionForce;

                    // Hard Collision with extra spacing for critical alerts
                    const radiusMultiplier = (b1.isCritical || b2.isCritical) ? 2 : 1;
                    const minDistance = (b1.radius + b2.radius) * radiusMultiplier;
                    const overlap = minDistance - dist;
                    const allowedOverlap = minDistance * cfg.maxOverlap;

                    if (overlap > allowedOverlap) {
                        const separationForce = cfg.hardCollisionForce * currentSpeedFactor;
                        b1.vx += (dx / dist) * separationForce;
                        b1.vy += (dy / dist) * separationForce;
                    }
                }

                // 3. Organic Noise
                b1.vx += (Math.random() - 0.5) * cfg.noiseStrength;
                b1.vy += (Math.random() - 0.5) * cfg.noiseStrength;

                // 4. Damping
                b1.vx *= cfg.damping;
                b1.vy *= cfg.damping;

                // Update Position
                b1.x += b1.vx;
                b1.y += b1.vy;

                // 5. Screen Boundaries
                const screenX = containerX + b1.x;
                const screenY = containerY + b1.y;
                const halfW = b1.width / 2;
                const halfH = b1.height / 2;

                // Left Boundary
                if (screenX - halfW < cfg.boundaryPadding) {
                    b1.x = cfg.boundaryPadding - containerX + halfW;
                    b1.vx *= -0.5;
                }
                // Right Boundary
                if (screenX + halfW > this.windowWidth - cfg.boundaryPadding) {
                    b1.x = this.windowWidth - cfg.boundaryPadding - containerX - halfW;
                    b1.vx *= -0.5;
                }
                // Top Boundary
                if (screenY - halfH < cfg.boundaryPadding) {
                    b1.y = cfg.boundaryPadding - containerY + halfH;
                    b1.vy *= -0.5;
                }
                // Bottom Boundary
                if (screenY + halfH > this.windowHeight - cfg.boundaryPadding) {
                    b1.y = this.windowHeight - cfg.boundaryPadding - containerY - halfH;
                    b1.vy *= -0.5;
                }

                // Apply to DOM
                const left = b1.x - halfW;
                const top = b1.y - halfH;

                const isHiding = b1.element.classList.contains('hide');
                const scale = isHiding ? 0.8 : (b1.element.classList.contains('show') ? 1 : 0.5);

                // Use translate3d for GPU acceleration
                b1.element.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${scale})`;
            }

            this.animationFrameId = requestAnimationFrame(updatePhysics);
        };

        updatePhysics();
    },

    suspend: function () {
        // Stop physics loop when module is suspended
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    resume: function () {
        // Restart physics loop when module is resumed
        this.startPhysicsLoop();
    }
});
