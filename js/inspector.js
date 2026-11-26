// js/inspector.js - ProCraftersBot Individual Bot Inspector, Radar, Perspectives, and Vitals
const { shell } = require('electron');
let prismarineViewer = null;
try {
    prismarineViewer = require('prismarine-viewer');
} catch (e) {}

function initInspector(guiSwarmManager, botApi, sendLog) {
    // DOM Elements
    const idInspectorBotSelect = document.getElementById('inspectorBotSelect');
    const idBtnRefreshInspectorBots = document.getElementById('btnRefreshInspectorBots');
    const idInspectorStatusBadge = document.getElementById('inspectorStatusBadge');

    const idInspectorHpText = document.getElementById('inspectorHpText');
    const idInspectorHeartsIcons = document.getElementById('inspectorHeartsIcons');
    const idInspectorHpFill = document.getElementById('inspectorHpFill');

    const idInspectorFoodText = document.getElementById('inspectorFoodText');
    const idInspectorFoodIcons = document.getElementById('inspectorFoodIcons');
    const idInspectorFoodFill = document.getElementById('inspectorFoodFill');
    const idInspectorSatText = document.getElementById('inspectorSatText');

    const idInspectorArmorText = document.getElementById('inspectorArmorText');
    const idInspectorOxygenText = document.getElementById('inspectorOxygenText');
    const idInspectorExpText = document.getElementById('inspectorExpText');

    // Sub-Tabs
    const idBtnSubRadar = document.getElementById('btnSubRadar');
    const idBtnSubCamera = document.getElementById('btnSubCamera');
    const idBtnSubDetails = document.getElementById('btnSubDetails');
    const idSubpanelRadar = document.getElementById('subpanelRadar');
    const idSubpanelCamera = document.getElementById('subpanelCamera');
    const idSubpanelDetails = document.getElementById('subpanelDetails');

    // Radar Elements
    const idRadarCanvas = document.getElementById('radarCanvas');
    const idRadarEntityCount = document.getElementById('radarEntityCount');
    const idRadarFacingText = document.getElementById('radarFacingText');
    const radarRangeBtns = document.querySelectorAll('.radar-range-btn');

    // Camera Elements
    const idBtnToggleCamera = document.getElementById('btnToggleCamera');
    const idCameraPerspectiveSelect = document.getElementById('cameraPerspectiveSelect');
    const idCameraCanvas = document.getElementById('cameraCanvas');
    const idCameraCrosshairTarget = document.getElementById('cameraCrosshairTarget');
    const idCameraFps = document.getElementById('cameraFps');

    // Prismarine Viewer Elements
    const idBtnLaunch3dViewer = document.getElementById('btnLaunch3dViewer');
    const idBtnStop3dViewer = document.getElementById('btnStop3dViewer');
    const idBtnOpenBrowserViewer = document.getElementById('btnOpenBrowserViewer');
    const idViewerIframeContainer = document.getElementById('viewerIframeContainer');
    const idViewerIframe = document.getElementById('viewerIframe');
    const idViewerStatusText = document.getElementById('viewerStatusText');

    // Details Elements
    const idInspectorPosText = document.getElementById('inspectorPosText');
    const idInspectorDimText = document.getElementById('inspectorDimText');
    const idInspectorBiomeText = document.getElementById('inspectorBiomeText');
    const idInspectorPitchText = document.getElementById('inspectorPitchText');
    const idInspectorYawText = document.getElementById('inspectorYawText');
    const idInspectorMainHand = document.getElementById('inspectorMainHand');
    const idInspectorOffHand = document.getElementById('inspectorOffHand');
    const idInspectorHelmet = document.getElementById('inspectorHelmet');
    const idInspectorChest = document.getElementById('inspectorChest');
    const idInspectorLegs = document.getElementById('inspectorLegs');
    const idInspectorBoots = document.getElementById('inspectorBoots');
    const idInspectorHotbarSlots = document.getElementById('inspectorHotbarSlots');
    const idInspectorStateText = document.getElementById('inspectorStateText');
    const idInspectorRoleText = document.getElementById('inspectorRoleText');
    const idInspectorEffectsText = document.getElementById('inspectorEffectsText');

    // State Variables
    let currentSelectedBot = null;
    let radarRange = 32;
    let isCameraActive = false;
    let cameraAnimFrameId = null;
    let radarIntervalId = null;
    let vitalsIntervalId = null;
    let activeSubTab = 'radar';
    let activeViewerPort = 3007;

    // SVG Heart & Drumstick Icons
    const SVG_FULL_HEART = `<svg width="15" height="15" viewBox="0 0 16 16"><path fill="#e06c75" d="M8 14s-5.5-3.5-7-7a4.5 4.5 0 0 1 7-3 4.5 4.5 0 0 1 7 3c-1.5 3.5-7 7-7 7z"/></svg>`;
    const SVG_HALF_HEART = `<svg width="15" height="15" viewBox="0 0 16 16"><path fill="#3b4252" d="M8 14s-5.5-3.5-7-7a4.5 4.5 0 0 1 7-3 4.5 4.5 0 0 1 7 3c-1.5 3.5-7 7-7 7z"/><path fill="#e06c75" d="M8 14s-5.5-3.5-7-7a4.5 4.5 0 0 1 7-3V14z"/></svg>`;
    const SVG_EMPTY_HEART = `<svg width="15" height="15" viewBox="0 0 16 16"><path fill="#3b4252" stroke="#2e3440" stroke-width="1" d="M8 14s-5.5-3.5-7-7a4.5 4.5 0 0 1 7-3 4.5 4.5 0 0 1 7 3c-1.5 3.5-7 7-7 7z"/></svg>`;

    const SVG_FULL_FOOD = `<svg width="15" height="15" viewBox="0 0 16 16"><circle cx="10" cy="6" r="4.5" fill="#d08770"/><rect x="4" y="9" width="4" height="2" transform="rotate(45 5 10)" fill="#eceff4"/><circle cx="3" cy="12" r="1.5" fill="#eceff4"/><circle cx="5" cy="14" r="1.5" fill="#eceff4"/></svg>`;
    const SVG_HALF_FOOD = `<svg width="15" height="15" viewBox="0 0 16 16"><circle cx="10" cy="6" r="4.5" fill="#3b4252"/><path d="M10 1.5 A4.5 4.5 0 0 0 10 10.5 Z" fill="#d08770"/><rect x="4" y="9" width="4" height="2" transform="rotate(45 5 10)" fill="#eceff4"/><circle cx="3" cy="12" r="1.5" fill="#eceff4"/><circle cx="5" cy="14" r="1.5" fill="#eceff4"/></svg>`;
    const SVG_EMPTY_FOOD = `<svg width="15" height="15" viewBox="0 0 16 16"><circle cx="10" cy="6" r="4.5" fill="#3b4252" stroke="#2e3440" stroke-width="1"/><rect x="4" y="9" width="4" height="2" transform="rotate(45 5 10)" fill="#4c566a"/></svg>`;

    // Helper: Get active bot instance
    function getActiveBot() {
        if (!guiSwarmManager) return null;
        if (idInspectorBotSelect && idInspectorBotSelect.value) {
            const b = guiSwarmManager.getBot(idInspectorBotSelect.value);
            if (b) return b;
        }
        const all = guiSwarmManager.getAllBots();
        return all.length > 0 ? all[0] : null;
    }

    // Refresh bot selector dropdown
    function updateBotListDropdown() {
        if (!idInspectorBotSelect) return;
        const allBots = guiSwarmManager ? guiSwarmManager.getAllBots() : [];
        const previousVal = idInspectorBotSelect.value;
        idInspectorBotSelect.innerHTML = '';

        if (allBots.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.innerText = 'No bots connected';
            idInspectorBotSelect.appendChild(opt);
            if (idInspectorStatusBadge) {
                idInspectorStatusBadge.innerText = 'Offline';
                idInspectorStatusBadge.style.background = '#bf616a';
                idInspectorStatusBadge.style.color = '#eceff4';
            }
            return;
        }

        allBots.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.username;
            opt.innerText = `${b.username} (${b.role || 'general'})`;
            if (b.username === previousVal) opt.selected = true;
            idInspectorBotSelect.appendChild(opt);
        });

        if (idInspectorStatusBadge) {
            idInspectorStatusBadge.innerText = 'Online';
            idInspectorStatusBadge.style.background = '#a3be8c';
            idInspectorStatusBadge.style.color = '#2e3440';
        }

        updateVitalsHUD();
    }

    if (idBtnRefreshInspectorBots) {
        idBtnRefreshInspectorBots.onclick = () => updateBotListDropdown();
    }

    if (idInspectorBotSelect) {
        idInspectorBotSelect.onchange = () => {
            updateVitalsHUD();
            if (isCameraActive && currentSelectedBot !== getActiveBot()) {
                // If viewer is active on a different bot, restart it for newly selected bot
                currentSelectedBot = getActiveBot();
            }
        };
    }

    // Listen to swarm events to auto-update dropdown
    if (botApi) {
        botApi.on('login', () => setTimeout(updateBotListDropdown, 300));
        botApi.on('spawn', () => setTimeout(updateBotListDropdown, 300));
        botApi.on('end', () => setTimeout(updateBotListDropdown, 300));
        botApi.on('kicked', () => setTimeout(updateBotListDropdown, 300));
    }

    // Sub-tab Navigation
    function switchSubTab(tab) {
        activeSubTab = tab;
        [idBtnSubRadar, idBtnSubCamera, idBtnSubDetails].forEach(b => b && b.classList.remove('button-selected'));
        [idSubpanelRadar, idSubpanelCamera, idSubpanelDetails].forEach(p => p && (p.style.display = 'none'));

        if (tab === 'radar') {
            if (idBtnSubRadar) idBtnSubRadar.classList.add('button-selected');
            if (idSubpanelRadar) idSubpanelRadar.style.display = 'block';
            startRadarLoop();
        } else if (tab === 'camera') {
            if (idBtnSubCamera) idBtnSubCamera.classList.add('button-selected');
            if (idSubpanelCamera) idSubpanelCamera.style.display = 'block';
        } else if (tab === 'details') {
            if (idBtnSubDetails) idBtnSubDetails.classList.add('button-selected');
            if (idSubpanelDetails) idSubpanelDetails.style.display = 'block';
            updateDetailsPanel();
        }
    }

    if (idBtnSubRadar) idBtnSubRadar.onclick = () => switchSubTab('radar');
    if (idBtnSubCamera) idBtnSubCamera.onclick = () => switchSubTab('camera');
    if (idBtnSubDetails) idBtnSubDetails.onclick = () => switchSubTab('details');

    // Radar range button click
    radarRangeBtns.forEach(btn => {
        btn.onclick = () => {
            radarRangeBtns.forEach(b => b.classList.remove('button-selected'));
            btn.classList.add('button-selected');
            radarRange = parseInt(btn.dataset.range, 10) || 32;
            renderRadar();
        };
    });

    // ==========================================
    // 1. VITALS HUD (Hearts & Hunger & Armor)
    // ==========================================
    function updateVitalsHUD() {
        const bot = getActiveBot();
        if (!bot) {
            if (idInspectorHpText) idInspectorHpText.innerText = '0 / 20 HP';
            if (idInspectorFoodText) idInspectorFoodText.innerText = '0 / 20 Food';
            if (idInspectorHeartsIcons) idInspectorHeartsIcons.innerHTML = SVG_EMPTY_HEART.repeat(10);
            if (idInspectorFoodIcons) idInspectorFoodIcons.innerHTML = SVG_EMPTY_FOOD.repeat(10);
            if (idInspectorHpFill) idInspectorHpFill.style.width = '0%';
            if (idInspectorFoodFill) idInspectorFoodFill.style.width = '0%';
            return;
        }

        const hp = Math.max(0, Math.min(20, Math.round(bot.health || 20)));
        const food = Math.max(0, Math.min(20, Math.round(bot.food !== undefined ? bot.food : 20)));
        const sat = (bot.foodSaturation !== undefined ? bot.foodSaturation : 5).toFixed(1);

        // Hearts rendering (10 hearts)
        let heartsHtml = '';
        for (let i = 0; i < 10; i++) {
            const hVal = (i + 1) * 2;
            if (hp >= hVal) {
                heartsHtml += SVG_FULL_HEART;
            } else if (hp >= hVal - 1) {
                heartsHtml += SVG_HALF_HEART;
            } else {
                heartsHtml += SVG_EMPTY_HEART;
            }
        }
        if (idInspectorHeartsIcons) idInspectorHeartsIcons.innerHTML = heartsHtml;
        if (idInspectorHpText) idInspectorHpText.innerText = `${hp} / 20 HP`;
        if (idInspectorHpFill) {
            idInspectorHpFill.style.width = `${(hp / 20) * 100}%`;
            idInspectorHpFill.style.background = hp > 10 ? '#a3be8c' : (hp > 5 ? '#ebcb8b' : '#bf616a');
        }

        // Food rendering (10 drumsticks)
        let foodHtml = '';
        for (let i = 0; i < 10; i++) {
            const fVal = (i + 1) * 2;
            if (food >= fVal) {
                foodHtml += SVG_FULL_FOOD;
            } else if (food >= fVal - 1) {
                foodHtml += SVG_HALF_FOOD;
            } else {
                foodHtml += SVG_EMPTY_FOOD;
            }
        }
        if (idInspectorFoodIcons) idInspectorFoodIcons.innerHTML = foodHtml;
        if (idInspectorFoodText) idInspectorFoodText.innerText = `${food} / 20 Food`;
        if (idInspectorSatText) idInspectorSatText.innerText = `Sat: ${sat}`;
        if (idInspectorFoodFill) {
            idInspectorFoodFill.style.width = `${(food / 20) * 100}%`;
        }

        // Oxygen & Armor & Exp
        let armorPoints = 0;
        if (bot.inventory && bot.inventory.slots) {
            // Check armor slots 5, 6, 7, 8
            const armorMap = {
                diamond_helmet: 3, diamond_chestplate: 8, diamond_leggings: 6, diamond_boots: 3,
                iron_helmet: 2, iron_chestplate: 6, iron_leggings: 5, iron_boots: 2,
                netherite_helmet: 3, netherite_chestplate: 8, netherite_leggings: 6, netherite_boots: 3,
                golden_helmet: 2, golden_chestplate: 5, golden_leggings: 3, golden_boots: 1,
                chainmail_helmet: 2, chainmail_chestplate: 5, chainmail_leggings: 4, chainmail_boots: 1,
                leather_helmet: 1, leather_chestplate: 3, leather_leggings: 2, leather_boots: 1
            };
            [5, 6, 7, 8].forEach(slot => {
                const item = bot.inventory.slots[slot];
                if (item && item.name && armorMap[item.name]) {
                    armorPoints += armorMap[item.name];
                }
            });
        }
        if (idInspectorArmorText) idInspectorArmorText.innerText = `Armor: ${armorPoints} / 20`;
        const oxygen = bot.oxygenLevel !== undefined ? bot.oxygenLevel : 20;
        if (idInspectorOxygenText) idInspectorOxygenText.innerText = `Oxygen: ${oxygen} / 20`;
        const lvl = bot.experience ? bot.experience.level : 0;
        if (idInspectorExpText) idInspectorExpText.innerText = `Level: ${lvl}`;
    }

    // ==========================================
    // 2. LIVE RADAR ENGINE
    // ==========================================
    function renderRadar() {
        if (!idRadarCanvas) return;
        const ctx = idRadarCanvas.getContext('2d');
        const w = idRadarCanvas.width;
        const h = idRadarCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxRadius = Math.min(w, h) / 2 - 14;

        // Clear canvas
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, w, h);

        const bot = getActiveBot();
        if (!bot || !bot.entity || !bot.entity.position) {
            ctx.fillStyle = '#6c7086';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Select an online bot to activate radar', cx, cy);
            return;
        }

        // Draw distance concentric rings
        const rings = [0.25, 0.5, 0.75, 1.0];
        ctx.lineWidth = 1;
        rings.forEach(rFrac => {
            const r = maxRadius * rFrac;
            ctx.strokeStyle = rFrac === 1.0 ? 'rgba(136, 192, 208, 0.4)' : 'rgba(92, 99, 112, 0.25)';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // Distance label
            ctx.fillStyle = 'rgba(147, 153, 178, 0.7)';
            ctx.font = '9px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${Math.round(radarRange * rFrac)}m`, cx + 3, cy - r + 9);
        });

        // Crosshairs (Axes)
        ctx.strokeStyle = 'rgba(92, 99, 112, 0.3)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - maxRadius);
        ctx.lineTo(cx, cy + maxRadius);
        ctx.moveTo(cx - maxRadius, cy);
        ctx.lineTo(cx + maxRadius, cy);
        ctx.stroke();

        // Cardinal directions
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#88c0d0';
        ctx.textAlign = 'center';
        ctx.fillText('N (-Z)', cx, cy - maxRadius + 11);
        ctx.fillText('S (+Z)', cx, cy + maxRadius - 2);
        ctx.textAlign = 'right';
        ctx.fillText('W (-X)', cx - maxRadius + 14, cy + 4);
        ctx.textAlign = 'left';
        ctx.fillText('E (+X)', cx + maxRadius - 14, cy + 4);

        const botPos = bot.entity.position;
        const botYaw = bot.entity.yaw || 0;

        // Draw Bot Field of View Cone (70 degrees)
        const fov = 70 * (Math.PI / 180);
        const lookAngle = botYaw - Math.PI / 2; // convert minecraft yaw to canvas angle
        ctx.fillStyle = 'rgba(136, 192, 208, 0.08)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxRadius * 0.9, lookAngle - fov / 2, lookAngle + fov / 2);
        ctx.closePath();
        ctx.fill();

        // Draw Central Bot (Player triangle facing yaw)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(lookAngle);
        ctx.fillStyle = '#88c0d0';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Facing direction string for UI
        const deg = Math.round(((botYaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
        let facingCompass = 'South';
        if (deg >= 337.5 || deg < 22.5) facingCompass = 'South';
        else if (deg >= 22.5 && deg < 67.5) facingCompass = 'South-West';
        else if (deg >= 67.5 && deg < 112.5) facingCompass = 'West';
        else if (deg >= 112.5 && deg < 157.5) facingCompass = 'North-West';
        else if (deg >= 157.5 && deg < 202.5) facingCompass = 'North';
        else if (deg >= 202.5 && deg < 247.5) facingCompass = 'North-East';
        else if (deg >= 247.5 && deg < 292.5) facingCompass = 'East';
        else if (deg >= 292.5 && deg < 337.5) facingCompass = 'South-East';
        if (idRadarFacingText) idRadarFacingText.innerText = `Facing: ${facingCompass} (${deg}°)`;

        // Plot nearby entities
        let countInRange = 0;
        const entities = Object.values(bot.entities || {});

        entities.forEach(entity => {
            if (!entity || !entity.position || entity === bot.entity || !entity.isValid) return;

            const dx = entity.position.x - botPos.x;
            const dz = entity.position.z - botPos.z;
            const dist = Math.hypot(dx, dz);

            if (dist > radarRange) return;
            countInRange++;

            // Canvas coordinate mapping
            const ex = cx + (dx / radarRange) * maxRadius;
            const ey = cy + (dz / radarRange) * maxRadius;

            // Classify entity
            let color = '#81a1c1';
            let shape = 'circle';
            const name = entity.username || entity.name || 'entity';

            if (entity.type === 'player') {
                const isSwarm = guiSwarmManager && guiSwarmManager.getBot(entity.username);
                color = isSwarm ? '#88c0d0' : '#81a1c1';
                shape = 'diamond';
            } else if (entity.kind === 'Hostile mobs') {
                color = '#bf616a';
                shape = 'triangle';
            } else if (entity.kind === 'Passive mobs') {
                color = '#a3be8c';
                shape = 'square';
            } else if (entity.type === 'object' || entity.name === 'item') {
                color = '#b48ead';
                shape = 'dot';
            }

            // Draw shape
            ctx.fillStyle = color;
            ctx.beginPath();
            if (shape === 'diamond') {
                ctx.moveTo(ex, ey - 4);
                ctx.lineTo(ex + 4, ey);
                ctx.lineTo(ex, ey + 4);
                ctx.lineTo(ex - 4, ey);
            } else if (shape === 'triangle') {
                ctx.moveTo(ex, ey - 4);
                ctx.lineTo(ex + 4, ey + 3);
                ctx.lineTo(ex - 4, ey + 3);
            } else if (shape === 'square') {
                ctx.rect(ex - 3, ey - 3, 6, 6);
            } else {
                ctx.arc(ex, ey, shape === 'dot' ? 2.5 : 3.5, 0, Math.PI * 2);
            }
            ctx.fill();

            // Label for close entities
            if (dist <= 18) {
                ctx.fillStyle = 'rgba(236, 239, 244, 0.85)';
                ctx.font = '9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${name} (${dist.toFixed(0)}m)`, ex, ey - 6);
            }
        });

        if (idRadarEntityCount) idRadarEntityCount.innerText = `Entities in range: ${countInRange}`;
    }

    function startRadarLoop() {
        if (radarIntervalId) clearInterval(radarIntervalId);
        renderRadar();
        radarIntervalId = setInterval(() => {
            if (activeSubTab === 'radar') renderRadar();
        }, 120);
    }

    // ==========================================
    // 3. PERSPECTIVES ENGINE (On Command!)
    // ==========================================
    function renderPerspectiveFrame() {
        if (!isCameraActive || !idCameraCanvas) return;
        const ctx = idCameraCanvas.getContext('2d');
        const w = idCameraCanvas.width;
        const h = idCameraCanvas.height;

        const bot = getActiveBot();
        if (!bot || !bot.entity || !bot.entity.position) {
            ctx.fillStyle = '#23272e';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#6c7086';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Select an online bot to activate camera', w / 2, h / 2);
            return;
        }

        const mode = idCameraPerspectiveSelect ? idCameraPerspectiveSelect.value : 'firstPerson';
        const pitch = bot.entity.pitch || 0;
        const yaw = bot.entity.yaw || 0;

        // Background / Sky & Ground
        ctx.fillStyle = '#1e222b';
        ctx.fillRect(0, 0, w, h);

        // Perspective Horizon calculation
        const horizonY = (h / 2) + Math.tan(pitch) * (h / 2.2);

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, Math.max(0, horizonY));
        skyGrad.addColorStop(0, '#1a233a');
        skyGrad.addColorStop(1, '#2e3440');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, Math.max(0, horizonY));

        // Ground gradient
        const groundGrad = ctx.createLinearGradient(0, Math.max(0, horizonY), 0, h);
        groundGrad.addColorStop(0, '#2e3440');
        groundGrad.addColorStop(1, '#3b4252');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, Math.max(0, horizonY), w, h - Math.max(0, horizonY));

        // Ground grid lines
        ctx.strokeStyle = 'rgba(76, 86, 106, 0.4)';
        ctx.lineWidth = 1;
        const vpX = w / 2;
        for (let x = -w; x <= w * 2; x += 35) {
            ctx.beginPath();
            ctx.moveTo(vpX, horizonY);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // Compass Tape on Top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, w, 20);
        ctx.strokeStyle = 'rgba(136, 192, 208, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(w, 20);
        ctx.stroke();

        const deg = (((-yaw * 180 / Math.PI) % 360) + 360) % 360;
        const compassDirs = [
            { d: 0, l: 'S' }, { d: 45, l: 'SW' }, { d: 90, l: 'W' }, { d: 135, l: 'NW' },
            { d: 180, l: 'N' }, { d: 225, l: 'NE' }, { d: 270, l: 'E' }, { d: 315, l: 'SE' }
        ];

        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        compassDirs.forEach(cd => {
            let diff = cd.d - deg;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            const xPos = w / 2 + diff * 2.2;
            if (xPos >= 10 && xPos <= w - 10) {
                ctx.fillStyle = cd.l.length === 1 ? '#88c0d0' : '#d8dee9';
                ctx.fillText(cd.l, xPos, 13);
            }
        });

        // Center Indicator on compass
        ctx.fillStyle = '#e06c75';
        ctx.beginPath();
        ctx.moveTo(w / 2, 16);
        ctx.lineTo(w / 2 - 3, 20);
        ctx.lineTo(w / 2 + 3, 20);
        ctx.closePath();
        ctx.fill();

        // Crosshair & Target info (First Person)
        if (mode === 'firstPerson') {
            ctx.strokeStyle = 'rgba(236, 239, 244, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 8, h / 2);
            ctx.lineTo(w / 2 + 8, h / 2);
            ctx.moveTo(w / 2, h / 2 - 8);
            ctx.lineTo(w / 2, h / 2 + 8);
            ctx.stroke();

            // Detect block / entity at crosshair
            let targetName = 'Air';
            let targetDist = '';
            if (typeof bot.blockAtCursor === 'function') {
                const b = bot.blockAtCursor(6);
                if (b && b.name && b.name !== 'air') {
                    targetName = b.name;
                    targetDist = `${bot.entity.position.distanceTo(b.position).toFixed(1)}m`;
                }
            }
            if (idCameraCrosshairTarget) {
                idCameraCrosshairTarget.innerText = `Focus: ${targetName} ${targetDist ? `(${targetDist})` : ''}`;
            }
        }

        // Render 3D Model when in Third Person or Top Down
        if (mode === 'thirdPersonBack' || mode === 'thirdPersonFront' || mode === 'isometric') {
            const isFront = mode === 'thirdPersonFront';
            const botCenterX = w / 2;
            const botCenterY = h / 2 + 25;

            // Render Bot Avatar Figure
            ctx.save();
            ctx.translate(botCenterX, botCenterY);

            // Shadow on ground
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 36, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.fillStyle = '#4c566a';
            ctx.fillRect(-8, 12, 6, 24);
            ctx.fillRect(2, 12, 6, 24);

            // Body / Torso
            ctx.fillStyle = '#5e81ac';
            ctx.fillRect(-10, -12, 20, 24);

            // Arms
            ctx.fillStyle = '#81a1c1';
            ctx.fillRect(-16, -12, 6, 22);
            ctx.fillRect(10, -12, 6, 22);

            // Head
            ctx.fillStyle = '#d8dee9';
            ctx.fillRect(-8, -28, 16, 16);

            // Face details if front view
            if (isFront) {
                ctx.fillStyle = '#2e3440';
                ctx.fillRect(-5, -22, 3, 3); // left eye
                ctx.fillRect(2, -22, 3, 3);  // right eye
                ctx.fillStyle = '#bf616a';
                ctx.fillRect(-3, -16, 6, 2); // mouth
            }

            // Weapon in Hand
            const held = bot.heldItem;
            if (held && held.name) {
                ctx.fillStyle = held.name.includes('sword') ? '#88c0d0' : (held.name.includes('bow') ? '#d08770' : '#ebcb8b');
                ctx.fillRect(15, -6, 4, 18);
            }

            // Shield in Offhand
            if (bot.hasShield && bot.hasShield()) {
                ctx.fillStyle = '#eceff4';
                ctx.fillRect(-20, -8, 5, 14);
            }

            // Username Tag above head
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-25, -42, 50, 12);
            ctx.fillStyle = '#eceff4';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(bot.username || 'Bot', 0, -33);

            ctx.restore();

            if (idCameraCrosshairTarget) {
                idCameraCrosshairTarget.innerText = `Camera: ${isFront ? 'Third Person Front' : (mode === 'isometric' ? 'Isometric Orbit' : 'Third Person Back')}`;
            }
        } else if (mode === 'topDown') {
            // Overhead View
            const cx = w / 2;
            const cy = h / 2;

            // Draw concentric altitude rings
            ctx.strokeStyle = 'rgba(136, 192, 208, 0.2)';
            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.arc(cx, cy, 70, 0, Math.PI * 2);
            ctx.stroke();

            // Bot Head & Direction Cone from top
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(yaw - Math.PI / 2);

            // Sight cone
            ctx.fillStyle = 'rgba(136, 192, 208, 0.15)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 70, -0.6, 0.6);
            ctx.closePath();
            ctx.fill();

            // Top-down player box
            ctx.fillStyle = '#5e81ac';
            ctx.fillRect(-8, -12, 16, 24);
            ctx.fillStyle = '#d8dee9';
            ctx.fillRect(-6, -6, 12, 12);
            ctx.fillStyle = '#88c0d0';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(4, -4);
            ctx.lineTo(4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            if (idCameraCrosshairTarget) {
                idCameraCrosshairTarget.innerText = 'Camera: Top-Down Overhead View';
            }
        }

        // FPS / Status
        if (idCameraFps) {
            idCameraFps.innerText = 'Camera: Active (30 FPS)';
            idCameraFps.style.color = '#a3be8c';
        }

        if (isCameraActive) {
            cameraAnimFrameId = requestAnimationFrame(renderPerspectiveFrame);
        }
    }

    function toggleCamera(forceState) {
        if (forceState !== undefined) {
            isCameraActive = forceState;
        } else {
            isCameraActive = !isCameraActive;
        }

        if (isCameraActive) {
            if (idBtnToggleCamera) {
                idBtnToggleCamera.innerText = '⏹ Stop Camera';
                idBtnToggleCamera.style.background = '#bf616a';
                idBtnToggleCamera.style.color = '#eceff4';
            }
            renderPerspectiveFrame();
        } else {
            if (cameraAnimFrameId) cancelAnimationFrame(cameraAnimFrameId);
            if (idBtnToggleCamera) {
                idBtnToggleCamera.innerText = '▶ Start Camera';
                idBtnToggleCamera.style.background = '#a3be8c';
                idBtnToggleCamera.style.color = '#2e3440';
            }
            if (idCameraFps) {
                idCameraFps.innerText = 'Status: Idle';
                idCameraFps.style.color = 'inherit';
            }
            // Clear canvas to dark idle
            if (idCameraCanvas) {
                const ctx = idCameraCanvas.getContext('2d');
                ctx.fillStyle = '#23272e';
                ctx.fillRect(0, 0, idCameraCanvas.width, idCameraCanvas.height);
                ctx.fillStyle = '#6c7086';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Camera is stopped (click Start Camera to activate)', idCameraCanvas.width / 2, idCameraCanvas.height / 2);
            }
        }
    }

    if (idBtnToggleCamera) {
        idBtnToggleCamera.onclick = () => toggleCamera();
    }

    if (idCameraPerspectiveSelect) {
        idCameraPerspectiveSelect.onchange = () => {
            if (isCameraActive) renderPerspectiveFrame();
        };
    }

    // ==========================================
    // 4. PRISMARINE 3D WEB VIEWER (On Command)
    // ==========================================
    if (idBtnLaunch3dViewer) {
        idBtnLaunch3dViewer.onclick = () => {
            const bot = getActiveBot();
            if (!bot) {
                if (idViewerStatusText) idViewerStatusText.innerText = 'No bot online to launch viewer.';
                return;
            }
            if (!prismarineViewer || typeof prismarineViewer.mineflayer !== 'function') {
                if (idViewerStatusText) idViewerStatusText.innerText = 'prismarine-viewer package not available.';
                return;
            }

            try {
                if (bot.viewer) {
                    bot.viewer.close();
                }
                const firstPerson = (idCameraPerspectiveSelect && idCameraPerspectiveSelect.value === 'firstPerson');
                prismarineViewer.mineflayer(bot, {
                    port: activeViewerPort,
                    firstPerson: firstPerson,
                    viewDistance: 4
                });

                if (idViewerIframe) {
                    idViewerIframe.src = `http://localhost:${activeViewerPort}`;
                }
                if (idViewerIframeContainer) idViewerIframeContainer.style.display = 'block';
                if (idBtnLaunch3dViewer) idBtnLaunch3dViewer.style.display = 'none';
                if (idBtnStop3dViewer) idBtnStop3dViewer.style.display = 'block';
                if (idBtnOpenBrowserViewer) idBtnOpenBrowserViewer.style.display = 'block';
                if (idViewerStatusText) {
                    idViewerStatusText.innerText = `3D Viewer live at http://localhost:${activeViewerPort}`;
                    idViewerStatusText.style.color = '#a3be8c';
                }
            } catch (err) {
                if (idViewerStatusText) idViewerStatusText.innerText = `Error: ${err.message}`;
            }
        };
    }

    if (idBtnStop3dViewer) {
        idBtnStop3dViewer.onclick = () => {
            const bot = getActiveBot();
            if (bot && bot.viewer && typeof bot.viewer.close === 'function') {
                try { bot.viewer.close(); } catch (e) {}
                bot.viewer = null;
            }
            if (idViewerIframe) idViewerIframe.src = 'about:blank';
            if (idViewerIframeContainer) idViewerIframeContainer.style.display = 'none';
            if (idBtnLaunch3dViewer) idBtnLaunch3dViewer.style.display = 'block';
            if (idBtnStop3dViewer) idBtnStop3dViewer.style.display = 'none';
            if (idBtnOpenBrowserViewer) idBtnOpenBrowserViewer.style.display = 'none';
            if (idViewerStatusText) {
                idViewerStatusText.innerText = '3D Viewer stopped.';
                idViewerStatusText.style.color = 'inherit';
            }
        };
    }

    if (idBtnOpenBrowserViewer) {
        idBtnOpenBrowserViewer.onclick = () => {
            if (shell && typeof shell.openExternal === 'function') {
                shell.openExternal(`http://localhost:${activeViewerPort}`);
            }
        };
    }

    // ==========================================
    // 5. DETAILS & INVENTORY PANEL
    // ==========================================
    function updateDetailsPanel() {
        const bot = getActiveBot();
        if (!bot) return;

        // Position & Environment
        if (bot.entity && bot.entity.position) {
            const p = bot.entity.position;
            if (idInspectorPosText) idInspectorPosText.innerText = `X: ${p.x.toFixed(1)} | Y: ${p.y.toFixed(1)} | Z: ${p.z.toFixed(1)}`;
            const yawDeg = Math.round((((bot.entity.yaw || 0) * 180 / Math.PI) % 360 + 360) % 360);
            const pitchDeg = Math.round(((bot.entity.pitch || 0) * 180 / Math.PI));
            if (idInspectorYawText) idInspectorYawText.innerText = `${yawDeg}°`;
            if (idInspectorPitchText) idInspectorPitchText.innerText = `${pitchDeg}°`;
        }

        if (idInspectorDimText) {
            idInspectorDimText.innerText = bot.game ? (bot.game.dimension || 'Overworld') : 'Overworld';
        }
        if (idInspectorBiomeText && bot.blockAt && bot.entity && bot.entity.position) {
            const block = bot.blockAt(bot.entity.position);
            idInspectorBiomeText.innerText = (block && block.biome && block.biome.name) ? block.biome.name : 'Plains';
        }

        // Equipment & Hands
        const mainHand = bot.heldItem;
        if (idInspectorMainHand) idInspectorMainHand.innerText = mainHand ? `${mainHand.name} (${mainHand.count})` : 'Empty';
        if (idInspectorOffHand && bot.inventory && bot.inventory.slots) {
            const off = bot.inventory.slots[45];
            idInspectorOffHand.innerText = off ? `${off.name}` : 'Empty';
        }
        if (bot.inventory && bot.inventory.slots) {
            const helm = bot.inventory.slots[5];
            const chest = bot.inventory.slots[6];
            const legs = bot.inventory.slots[7];
            const boots = bot.inventory.slots[8];
            if (idInspectorHelmet) idInspectorHelmet.innerText = helm ? helm.name : 'None';
            if (idInspectorChest) idInspectorChest.innerText = chest ? chest.name : 'None';
            if (idInspectorLegs) idInspectorLegs.innerText = legs ? legs.name : 'None';
            if (idInspectorBoots) idInspectorBoots.innerText = boots ? boots.name : 'None';
        }

        // Hotbar Slots 1-9 (slots 36-44)
        if (idInspectorHotbarSlots && bot.inventory && bot.inventory.slots) {
            idInspectorHotbarSlots.innerHTML = '';
            const selectedQuickBar = bot.quickBarSlot || 0;
            for (let i = 0; i < 9; i++) {
                const item = bot.inventory.slots[36 + i];
                const slotDiv = document.createElement('div');
                const isSelected = i === selectedQuickBar;
                slotDiv.style.cssText = `background: ${isSelected ? '#5e81ac' : '#2e3440'}; border: 1px solid ${isSelected ? '#88c0d0' : '#434c5e'}; border-radius: 3px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 9px; overflow: hidden; padding: 1px;`;
                slotDiv.title = item ? `${item.name} (${item.count})` : `Slot ${i + 1}: Empty`;
                slotDiv.innerText = item ? (item.count > 1 ? `${item.count}` : '•') : `${i + 1}`;
                idInspectorHotbarSlots.appendChild(slotDiv);
            }
        }

        // State & AI
        if (idInspectorStateText) idInspectorStateText.innerText = bot.state || 'idle';
        if (idInspectorRoleText) idInspectorRoleText.innerText = bot.role || 'general';

        // Potion Effects
        if (idInspectorEffectsText) {
            const effects = bot.entity ? bot.entity.effects : null;
            if (effects && Object.keys(effects).length > 0) {
                const names = Object.keys(effects).map(id => {
                    const eff = effects[id];
                    const dur = Math.round((eff.duration || 0) / 20);
                    return `ID ${id} (${dur}s)`;
                });
                idInspectorEffectsText.innerText = names.join(', ');
            } else {
                idInspectorEffectsText.innerText = 'None';
            }
        }
    }

    // Periodic Background Loop for Vitals & Selected Bot Synchronization
    vitalsIntervalId = setInterval(() => {
        updateVitalsHUD();
        if (activeSubTab === 'details') {
            updateDetailsPanel();
        }
    }, 500);

    // Bot list click sync
    const idBotList = document.getElementById('botList');
    if (idBotList) {
        idBotList.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'LI') {
                const name = e.target.innerText.trim();
                if (idInspectorBotSelect && name) {
                    idInspectorBotSelect.value = name;
                    updateVitalsHUD();
                    renderRadar();
                    if (activeSubTab === 'details') updateDetailsPanel();
                }
            }
        });
    }

    const inspectorButton = document.querySelector('button[data-target=".inspector"]');
    if (inspectorButton) {
        inspectorButton.addEventListener('click', () => {
            updateBotListDropdown();
            updateVitalsHUD();
            if (activeSubTab === 'radar') renderRadar();
            else if (activeSubTab === 'details') updateDetailsPanel();
        });
    }

    // Initial setup
    updateBotListDropdown();
    toggleCamera(false); // Make sure camera is NOT always active!
    renderRadar();
}

module.exports = {
    initInspector
};
