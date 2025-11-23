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
        }
    },

    // Module state
    bubbles: [],
    systemTemperature: 0,
    animationFrameId: null,

    // Required version
    requiresVersion: "2.1.0",

    start: function () {
        Log.info("Starting module: " + this.name);
        this.isDarkMode = this.config.defaultDarkMode;
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

        return wrapper;
    },

    notificationReceived: function (notification, payload, sender) {
        if (notification === "DOM_OBJECTS_CREATED") {
            this.messageContainer = document.getElementById("aura-message-container");
            // Start physics loop
            this.startPhysicsLoop();
        }

        // Listen for AURA_NOTE_SHOW notifications from other modules
        if (notification === "AURA_NOTE_SHOW" && payload) {
            this.createBubble(
                payload.content || "Notification",
                payload.isHTML || false,
                payload.timer !== undefined ? payload.timer : this.config.defaultTimer,
                payload.buttonLabel || null,
                payload.buttonUrl || null,
                payload.isCritical || false
            );
        }

        // Listen for AURA_NOTE_CLEAR to dismiss all bubbles
        if (notification === "AURA_NOTE_CLEAR") {
            this.clearAllBubbles();
        }
    },

    createBubble: function (content, isHTML, timer, buttonLabel, buttonUrl, isCritical) {
        if (!this.messageContainer) {
            Log.error("Message container not ready");
            return;
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
            id: Date.now() + Math.random(),
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

    dismissBubble: function (bubbleToRemove) {
        const index = this.bubbles.findIndex(b => b.id === bubbleToRemove.id);
        if (index > -1) {
            const bubble = this.bubbles[index];

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

    clearAllBubbles: function () {
        // Dismiss all bubbles
        const bubblesToRemove = [...this.bubbles];
        bubblesToRemove.forEach(bubble => this.dismissBubble(bubble));
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
        this.animateTimer(bubble, duration);

        bubble.timerTimeout = setTimeout(() => {
            this.dismissBubble(bubble);
        }, duration);
    },

    animateTimer: function (bubble, duration) {
        const animate = () => {
            if (!bubble.timerRect || !bubble.element.parentElement) {
                return;
            }

            const elapsed = Date.now() - bubble.timerStartTime;
            const progress = Math.min(elapsed / duration, 1);

            const width = bubble.element.offsetWidth;
            const height = bubble.element.offsetHeight;
            const padding = 6;
            const borderRadius = 24 + padding;

            const rectWidth = width + (padding * 2);
            const rectHeight = height + (padding * 2);

            const perimeter = 2 * (rectWidth + rectHeight) - 8 * borderRadius + 2 * Math.PI * borderRadius;
            const offset = perimeter * (1 - progress);
            bubble.timerRect.style.strokeDashoffset = offset;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    startPhysicsLoop: function () {
        const updatePhysics = () => {
            const cfg = this.config.physicsConfig;
            this.systemTemperature *= cfg.tempDecay;
            const currentSpeedFactor = cfg.baseSpeed + (cfg.activeSpeed - cfg.baseSpeed) * this.systemTemperature;

            // Container is at bottom: 20%, left: 50%
            const containerX = window.innerWidth / 2;
            const containerY = window.innerHeight * 0.8;

            for (let i = 0; i < this.bubbles.length; i++) {
                const b1 = this.bubbles[i];

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
                if (screenX + halfW > window.innerWidth - cfg.boundaryPadding) {
                    b1.x = window.innerWidth - cfg.boundaryPadding - containerX - halfW;
                    b1.vx *= -0.5;
                }
                // Top Boundary
                if (screenY - halfH < cfg.boundaryPadding) {
                    b1.y = cfg.boundaryPadding - containerY + halfH;
                    b1.vy *= -0.5;
                }
                // Bottom Boundary
                if (screenY + halfH > window.innerHeight - cfg.boundaryPadding) {
                    b1.y = window.innerHeight - cfg.boundaryPadding - containerY - halfH;
                    b1.vy *= -0.5;
                }

                // Apply to DOM
                const left = b1.x - halfW;
                const top = b1.y - halfH;

                const isHiding = b1.element.classList.contains('hide');
                const scale = isHiding ? 0.8 : (b1.element.classList.contains('show') ? 1 : 0.5);

                b1.element.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
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
