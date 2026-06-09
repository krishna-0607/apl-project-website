(function () {
    "use strict";

    const STORAGE_KEY_BEST = "apl_dino_best";
    const canvas = document.getElementById("game");
    const scoreEl = document.getElementById("score");
    const bestEl = document.getElementById("best");
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlayTitle");
    const overlayText = document.getElementById("overlayText");
    const primaryAction = document.getElementById("primaryAction");
    const secondaryAction = document.getElementById("secondaryAction");

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
        return;
    }

    const safeStorage = {
        getNumber(key, fallback) {
            try {
                const value = Number(localStorage.getItem(key));
                return Number.isFinite(value) ? value : fallback;
            } catch {
                return fallback;
            }
        },
        setString(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch {
                // ignore storage failures (private mode / disabled storage)
            }
        }
    };

    const state = {
        running: false,
        paused: false,
        crashed: false,
        score: 0,
        best: safeStorage.getNumber(STORAGE_KEY_BEST, 0),
        timeSinceSpawn: 0,
        nextSpawnAfter: 1.1,
        speed: 410,
        worldWidth: 900,
        worldHeight: 240,
        groundY: 198,
        obstacles: [],
        clouds: [],
        input: {
            jumpQueued: false,
            duckHeld: false
        }
    };

    bestEl.textContent = String(state.best);

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const rand = (min, max) => min + Math.random() * (max - min);

    const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const cssWidth = Math.max(320, Math.floor(rect.width));
        const cssHeight = Math.floor(cssWidth * (state.worldHeight / state.worldWidth));

        canvas.style.height = `${cssHeight}px`;

        const dpr = clamp(window.devicePixelRatio || 1, 1, 3);
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        state.scaleX = cssWidth / state.worldWidth;
        state.scaleY = cssHeight / state.worldHeight;
    };

    const roundRect = (context, x, y, w, h, r) => {
        if (typeof context.roundRect === "function") {
            context.roundRect(x, y, w, h, r);
            return;
        }

        const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
        context.moveTo(x + radius, y);
        context.arcTo(x + w, y, x + w, y + h, radius);
        context.arcTo(x + w, y + h, x, y + h, radius);
        context.arcTo(x, y + h, x, y, radius);
        context.arcTo(x, y, x + w, y, radius);
        context.closePath();
    };

    const dino = {
        x: 86,
        y: 0,
        w: 44,
        h: 50,
        vy: 0
    };

    const setOverlay = ({ visible, title, text, primaryLabel, secondaryLabel, secondaryDisabled }) => {
        if (typeof title === "string") overlayTitle.textContent = title;
        if (typeof text === "string") overlayText.textContent = text;
        if (typeof primaryLabel === "string") primaryAction.textContent = primaryLabel;
        if (typeof secondaryLabel === "string") secondaryAction.textContent = secondaryLabel;
        secondaryAction.disabled = Boolean(secondaryDisabled);
        overlay.classList.toggle("is-hidden", !visible);
    };

    const reset = () => {
        state.running = false;
        state.paused = false;
        state.crashed = false;
        state.score = 0;
        state.timeSinceSpawn = 0;
        state.nextSpawnAfter = 0.95;
        state.speed = 410;
        state.obstacles = [];
        state.clouds = [];
        state.input.jumpQueued = false;
        state.input.duckHeld = false;

        dino.w = 44;
        dino.h = 50;
        dino.vy = 0;
        dino.y = state.groundY - dino.h;

        scoreEl.textContent = "0";
        bestEl.textContent = String(state.best);
    };

    const start = () => {
        if (state.running) {
            return;
        }
        state.running = true;
        state.paused = false;
        state.crashed = false;
        setOverlay({ visible: false });
    };

    const togglePause = () => {
        if (!state.running || state.crashed) {
            return;
        }
        state.paused = !state.paused;
        setOverlay({
            visible: state.paused,
            title: "Paused",
            text: "Press P to resume, or click Resume.",
            primaryLabel: "Resume",
            secondaryLabel: "Restart",
            secondaryDisabled: false
        });
    };

    const crash = () => {
        state.crashed = true;
        state.running = false;

        const current = Math.floor(state.score);
        if (current > state.best) {
            state.best = current;
            safeStorage.setString(STORAGE_KEY_BEST, String(state.best));
            bestEl.textContent = String(state.best);
        }

        setOverlay({
            visible: true,
            title: "Crash!",
            text: "Press Space/click to restart.",
            primaryLabel: "Restart",
            secondaryLabel: "Pause",
            secondaryDisabled: true
        });
    };

    const isOnGround = () => Math.abs(dino.y - (state.groundY - dino.h)) < 0.1;

    const applyDuck = () => {
        if (!state.input.duckHeld) {
            if (dino.h !== 50) {
                dino.h = 50;
                dino.w = 44;
                dino.y = Math.min(dino.y, state.groundY - dino.h);
            }
            return;
        }

        if (isOnGround()) {
            dino.h = 30;
            dino.w = 56;
            dino.y = state.groundY - dino.h;
        }
    };

    const queueJump = () => {
        state.input.jumpQueued = true;
    };

    const stepPhysics = (dt) => {
        const gravity = 2400;
        const jumpVelocity = -820;

        applyDuck();

        if (state.input.jumpQueued) {
            state.input.jumpQueued = false;
            if (isOnGround()) {
                dino.vy = jumpVelocity;
            }
        }

        dino.vy += gravity * dt;
        dino.y += dino.vy * dt;

        const floorY = state.groundY - dino.h;
        if (dino.y > floorY) {
            dino.y = floorY;
            dino.vy = 0;
        }
    };

    const spawnObstacle = () => {
        const tall = Math.random() < 0.22;
        const height = tall ? 58 : rand(36, 50);
        const width = tall ? 24 : rand(18, 26);
        const y = state.groundY - height;
        state.obstacles.push({
            x: state.worldWidth + 20,
            y,
            w: width,
            h: height
        });
    };

    const spawnCloud = () => {
        state.clouds.push({
            x: state.worldWidth + 40,
            y: rand(28, 84),
            w: rand(44, 82),
            speed: rand(28, 52),
            alpha: rand(0.18, 0.35)
        });
    };

    const intersects = (a, b) => {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    };

    const stepWorld = (dt) => {
        state.speed = clamp(state.speed + dt * 8.5, 410, 900);

        for (const cloud of state.clouds) {
            cloud.x -= cloud.speed * dt;
        }
        state.clouds = state.clouds.filter((cloud) => cloud.x + cloud.w > -30);
        if (state.clouds.length < 5 && Math.random() < 0.015) {
            spawnCloud();
        }

        for (const obstacle of state.obstacles) {
            obstacle.x -= state.speed * dt;
        }
        state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -60);

        state.timeSinceSpawn += dt;
        if (state.timeSinceSpawn >= state.nextSpawnAfter) {
            state.timeSinceSpawn = 0;
            spawnObstacle();
            const speedFactor = clamp((state.speed - 410) / 500, 0, 1);
            state.nextSpawnAfter = rand(0.85, 1.35) - speedFactor * 0.22;
        }

        const hitbox = {
            x: dino.x + 6,
            y: dino.y + 4,
            w: dino.w - 12,
            h: dino.h - 8
        };
        for (const obstacle of state.obstacles) {
            if (intersects(hitbox, obstacle)) {
                crash();
                return;
            }
        }

        state.score += dt * 10;
        scoreEl.textContent = String(Math.floor(state.score));
    };

    const draw = () => {
        ctx.fillStyle = "#0a1220";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(state.scaleX, state.scaleY);

        const groundLine = state.groundY + 0.5;
        ctx.fillStyle = "rgba(173, 192, 217, 0.08)";
        ctx.fillRect(0, groundLine, state.worldWidth, state.worldHeight - groundLine);

        ctx.strokeStyle = "rgba(173, 192, 217, 0.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundLine);
        ctx.lineTo(state.worldWidth, groundLine);
        ctx.stroke();

        for (const cloud of state.clouds) {
            ctx.fillStyle = `rgba(235, 243, 255, ${cloud.alpha})`;
            ctx.beginPath();
            roundRect(ctx, cloud.x, cloud.y, cloud.w, 18, 8);
            ctx.fill();
        }

        for (const obstacle of state.obstacles) {
            ctx.fillStyle = "rgba(61, 212, 255, 0.7)";
            ctx.beginPath();
            roundRect(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, 6);
            ctx.fill();
            ctx.fillStyle = "rgba(245, 158, 11, 0.33)";
            ctx.fillRect(obstacle.x + 2, obstacle.y + 6, Math.max(2, obstacle.w - 4), 4);
        }

        ctx.fillStyle = state.crashed ? "rgba(245, 158, 11, 0.9)" : "rgba(235, 243, 255, 0.92)";
        ctx.beginPath();
        roundRect(ctx, dino.x, dino.y, dino.w, dino.h, 10);
        ctx.fill();

        ctx.fillStyle = "rgba(11, 19, 32, 0.85)";
        ctx.beginPath();
        ctx.arc(dino.x + dino.w - 14, dino.y + 16, 3.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    let lastTs = 0;
    const frame = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = clamp((ts - lastTs) / 1000, 0, 0.04);
        lastTs = ts;

        if (state.running && !state.paused && !state.crashed) {
            stepPhysics(dt);
            stepWorld(dt);
        }

        draw();
        window.requestAnimationFrame(frame);
    };

    const onPrimary = () => {
        if (!state.running && !state.paused) {
            reset();
            start();
            return;
        }
        if (state.paused) {
            state.paused = false;
            setOverlay({ visible: false });
            return;
        }
        if (state.crashed) {
            reset();
            start();
        }
    };

    const onSecondary = () => {
        if (state.paused) {
            reset();
            start();
            return;
        }
        togglePause();
    };

    primaryAction.addEventListener("click", onPrimary);
    secondaryAction.addEventListener("click", onSecondary);

    canvas.addEventListener("pointerdown", () => {
        if (state.crashed) {
            onPrimary();
            return;
        }
        if (!state.running) {
            onPrimary();
            return;
        }
        queueJump();
    });

    window.addEventListener("keydown", (event) => {
        if (event.code === "ArrowDown") {
            state.input.duckHeld = true;
            return;
        }

        if (event.code === "KeyP") {
            event.preventDefault();
            if (state.paused) {
                onPrimary();
            } else {
                togglePause();
            }
            return;
        }

        if (event.code !== "Space" && event.code !== "ArrowUp") {
            return;
        }

        event.preventDefault();

        if (state.crashed || !state.running) {
            onPrimary();
            return;
        }

        if (state.paused) {
            onPrimary();
            return;
        }

        queueJump();
    }, { passive: false });

    window.addEventListener("keyup", (event) => {
        if (event.code === "ArrowDown") {
            state.input.duckHeld = false;
        }
    });

    window.addEventListener("blur", () => {
        if (state.running && !state.paused && !state.crashed) {
            togglePause();
        }
    });

    window.addEventListener("resize", () => resize());
    resize();
    reset();
    spawnCloud();
    spawnCloud();
    setOverlay({
        visible: true,
        title: "Ready?",
        text: "Click/tap the game or press Space to start.",
        primaryLabel: "Start",
        secondaryLabel: "Pause",
        secondaryDisabled: true
    });
    window.requestAnimationFrame(frame);
})();
