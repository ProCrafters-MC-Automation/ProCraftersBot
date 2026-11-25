const { ipcRenderer, shell } = require("electron");
const fs = require('fs');
const path = require('path');
const { connectBot, delay, salt, addPlayer, rmPlayer, errBot, botApi, sendLog, exeAll, checkVer, startScript, loadTheme, createPopup, formatText, selectedList, checkAuth, createBot, scrapeProxy } = require(path.join(__dirname, "js", "utils.js"));
const { checkProxy } = require(path.join(__dirname, "js", "plugins", "proxy.js"));
const antiafk = require(path.join(__dirname, "js", "plugins", "afk.js"));

// Unified ProCraftersBot Backend Integrations
const { initBot } = require(path.join(__dirname, 'src', 'botInit.js'));
const { SwarmManager } = require(path.join(__dirname, 'src', 'swarmManager.js'));
const { bodyguardSystem } = require(path.join(__dirname, 'src', 'bodyguard.js'));
const { commandsPrinter } = require(path.join(__dirname, 'src', 'commandsPrinter.js'));
const { placerPrinter } = require(path.join(__dirname, 'src', 'placerPrinter.js'));
const Utils = require(path.join(__dirname, 'src', 'utils.js'));

const guiSwarmManager = new SwarmManager({});

let currentTime;

// DOM Element IDs
const idBotUsername = document.getElementById('botUsename');
const idAuthType = document.getElementById('botAuthType');
const idIp = document.getElementById('botConnectIp');
const idBotCount = document.getElementById('botCount');
const idJoinDelay = document.getElementById('joinDelay');
const idJoinMessage = document.getElementById('joinMessage');
const idBtnStart = document.getElementById('btnStart');
const idBtnStop = document.getElementById('btnStop');
const idBotVersion = document.getElementById('botversion');
const idBotList = document.getElementById('botList');
const idBtnDc = document.getElementById('btnDisconnect');
const idBtnRc = document.getElementById('btnReconnect');
const idBtnUse = document.getElementById('btnUseHeld');
const idBtnClose = document.getElementById('btnCloseWin');
const idBtnStartScript = document.getElementById('btnStartScript');
const idBtnChat = document.getElementById('btnChatMessage');
const idChatMessage = document.getElementById('chatMessage');
const idSpamMessage = document.getElementById('spamMessageBox');
const idSpamDelay = document.getElementById('spamDelay');
const idProxyToggle = document.getElementById('useProxy');
const idDownbarBotCount = document.getElementById('downbarBotCount');
const idChatBox = document.getElementById('chatBox');
const idCheckAutoRc = document.getElementById('checkboxAutoRc');
const idReconDelay = document.getElementById('reconDelay');
const idBtnSpam = document.getElementById('startSpam');
const idBtnSpamStop = document.getElementById('stopSpam');
const idUptime = document.getElementById('uptime');
const idHotbarSlot = document.getElementById('hotbarSlot');
const idBtnSetHotbar = document.getElementById('btnSetHotbar');
const idBtnWinClickSlot = document.getElementById('windowValue');
const idClickWinLoR = document.getElementById('clickWindowLorR');
const idBtnWinClick = document.getElementById('btnWindowClick');
const idControlValue = document.getElementById('controlValue');
const idControlStart = document.getElementById('startControl');
const idControlStop = document.getElementById('stopControl');
const idLookValue = document.getElementById('lookValue');
const idBtnLookAt = document.getElementById('setLook');
const idCheckSprint = document.getElementById('checkboxSprint');
const idBtnDrop = document.getElementById('btnDrop');
const idDropValue = document.getElementById('dropValue');
const idLinearValue = document.getElementById('linearValue');
const idScriptPath = document.getElementById('scriptPath');
const idScriptCheck = document.getElementById('scriptCheck');
const idAccountFileCheck = document.getElementById('accountFileCheck');
const idAccountFilePath = document.getElementById('accountFilePath');
const idBtnM = document.getElementById('btnMinimize');
const idBtnC = document.getElementById('btnClose');
const idProxyFilePath = document.getElementById('proxyFilePath');
const idProxyType = document.getElementById('proxyType');
const idProxyOrderRnd = document.getElementById('proxyOrderRnd');
const idCheckAntiSpam = document.getElementById('checkAntiSpam');
const idAntiAfkLoad = document.getElementById('loadAntiAfk');
const idStartAfk = document.getElementById('startAfk');
const idStopAfk = document.getElementById('stopAfk');
const antiSpamLength = document.getElementById('antiSpamLength');
const idBtnCustomCss = document.getElementById('btnSaveTheme');
const idCustomCssFile = document.getElementById('customCssFile');
const idPopupUl = document.getElementById('listul');
const idShowChatCheck = document.getElementById('showChatCheck');
const idWindow = document.getElementById('botOpenWindow');
const idWindowTitle = document.getElementById('botOpenWindowName');
const idKarange = document.getElementById('kaRange');
const idKadelay = document.getElementById('kaDelay');
const idTplayer = document.getElementById('kaTp');
const idTvehicle = document.getElementById('kaTv');
const idTmob = document.getElementById('kaTm');
const idTanimal = document.getElementById('kaTa');
const idKaToggle = document.getElementById('toggleka');
const idKaLook = document.getElementById('toggleKaLook');
const idAutoSelect = document.getElementById('toggleAutoSelect');
const idCheckOnRespawn = document.getElementById('scriptCheckOnRespawn');
const idCheckOnDeath = document.getElementById('scriptCheckOnDeath');
const idCheckIgnoreFriends = document.getElementById('checkKaIgnoreSelected');
const idAltToken = document.getElementById('easymcAuthToken');
const idStartScrape = document.getElementById('proxyScrapeStart');
const idProxyLogs = document.getElementById('proxyLogs');
const idScrapeProtocol = document.getElementById('proxyScrapeProtocol');
const idProxylist = document.getElementById('proxyTextBox');
const idStartProxyCheck = document.getElementById('buttonStartCheckBoxList');
const idProxyCheckProtocol = document.getElementById('proxyCheckProtocol');
const idProxyTimeout = document.getElementById('proxyTimeout');
const idproxyCheckDelay = document.getElementById('proxyCheckDelay');
const idStopCheck = document.getElementById('buttonStopCheck');
const idProxyDownbar = document.getElementById('proxyInfoDownbar');
const idCheckCount = document.getElementById('proxyInfoDownbarCount');
const idBtnCheckFile = document.getElementById('checkProxyfile');
const idTabBot = document.getElementById('btnBotting');
const idNameMethod = document.getElementById('usernameMethod');

// Bodyguard DOM elements
const idBgBossTarget = document.getElementById('bgBossTarget');
const idBgPersonalSpace = document.getElementById('bgPersonalSpace');
const idBtnBgAssignSelected = document.getElementById('btnBgAssignSelected');
const idBtnBgAssignAll = document.getElementById('btnBgAssignAll');
const idBtnBgStop = document.getElementById('btnBgStop');
const idBgNewCount = document.getElementById('bgNewCount');
const idBgNewPrefix = document.getElementById('bgNewPrefix');
const idBtnBgSpawnNew = document.getElementById('btnBgSpawnNew');
const idBtnBgDismiss = document.getElementById('btnBgDismiss');
const idBgAttackTarget = document.getElementById('bgAttackTarget');
const idBtnBgAttack = document.getElementById('btnBgAttack');
const idBtnBgHalt = document.getElementById('btnBgHalt');
const idBgStatusLabel = document.getElementById('bgStatusLabel');
const idCombatStatusLabel = document.getElementById('combatStatusLabel');
const idBtnTaskStopHarvest = document.getElementById('btnTaskStopHarvest');
const idBtnTaskStopAuto = document.getElementById('btnTaskStopAuto');

// Printers DOM elements
const idPrintX = document.getElementById('printX');
const idPrintY = document.getElementById('printY');
const idPrintZ = document.getElementById('printZ');
const idBtnGetPlayerPos = document.getElementById('btnGetPlayerPos');
const idPrintImagePath = document.getElementById('printImagePath');
const idPrintFilePicker = document.getElementById('printFilePicker');
const idCmdPrintMode = document.getElementById('cmdPrintMode');
const idCmdNewBotsRow = document.getElementById('cmdNewBotsRow');
const idCmdPrintNewCount = document.getElementById('cmdPrintNewCount');
const idCmdPrintPrefix = document.getElementById('cmdPrintPrefix');
const idCmdPrintDelay = document.getElementById('cmdPrintDelay');
const idBtnCmdPrintStart = document.getElementById('btnCmdPrintStart');
const idBtnCmdPrintStop = document.getElementById('btnCmdPrintStop');
const idPlacerPrintMode = document.getElementById('placerPrintMode');
const idPlacerNewBotsRow = document.getElementById('placerNewBotsRow');
const idPlacerPalette = document.getElementById('placerPalette');
const idPlacerDimensions = document.getElementById('placerDimensions');
const idPlacerNewCount = document.getElementById('placerNewCount');
const idPlacerPrefix = document.getElementById('placerPrefix');
const idBtnPlacerPrintStart = document.getElementById('btnPlacerPrintStart');
const idBtnPlacerPrintStop = document.getElementById('btnPlacerPrintStop');
const idPrinterStatusLabel = document.getElementById('printerStatusLabel');

// Tasks DOM elements
const idTaskPlayerTarget = document.getElementById('taskPlayerTarget');
const idBtnTaskCome = document.getElementById('btnTaskCome');
const idBtnTaskFollow = document.getElementById('btnTaskFollow');
const idTaskGotoX = document.getElementById('taskGotoX');
const idTaskGotoY = document.getElementById('taskGotoY');
const idTaskGotoZ = document.getElementById('taskGotoZ');
const idBtnTaskGoto = document.getElementById('btnTaskGoto');
const idBtnTaskSetHome = document.getElementById('btnTaskSetHome');
const idBtnTaskGoHome = document.getElementById('btnTaskGoHome');
const idBtnTaskStopAll = document.getElementById('btnTaskStopAll');
const idTaskBlockName = document.getElementById('taskBlockName');
const idTaskBlockCount = document.getElementById('taskBlockCount');
const idBtnTaskHarvest = document.getElementById('btnTaskHarvest');
const idTaskCraftName = document.getElementById('taskCraftName');
const idTaskCraftCount = document.getElementById('taskCraftCount');
const idBtnTaskCraft = document.getElementById('btnTaskCraft');
const idTaskHuntCount = document.getElementById('taskHuntCount');
const idBtnTaskHunt = document.getElementById('btnTaskHunt');
const idBtnTaskCollect = document.getElementById('btnTaskCollect');
const idTaskDropItem = document.getElementById('taskDropItem');
const idBtnTaskDropItem = document.getElementById('btnTaskDropItem');
// Resource Bots Tasks DOM elements
const idTaskRelX = document.getElementById('taskRelX');
const idTaskRelY = document.getElementById('taskRelY');
const idTaskRelZ = document.getElementById('taskRelZ');
const idBtnTaskRelMove = document.getElementById('btnTaskRelMove');
const idTaskHoleDim = document.getElementById('taskHoleDim');
const idBtnTaskHole = document.getElementById('btnTaskHole');
const idTaskEquipName = document.getElementById('taskEquipName');
const idBtnTaskEquip = document.getElementById('btnTaskEquip');
const idBtnTaskNearby = document.getElementById('btnTaskNearby');
const idTaskLocateTarget = document.getElementById('taskLocateTarget');
const idBtnTaskLocate = document.getElementById('btnTaskLocate');
const idBtnTaskProtect = document.getElementById('btnTaskProtect');
const idBtnTaskGuardPos = document.getElementById('btnTaskGuardPos');
const idBtnTaskLearn = document.getElementById('btnTaskLearn');
const idBtnTaskRecite = document.getElementById('btnTaskRecite');
const idTaskMemoryKey = document.getElementById('taskMemoryKey');
const idTaskMemoryVal = document.getElementById('taskMemoryVal');
const idBtnTaskRemember = document.getElementById('btnTaskRemember');
const idBtnTaskValueOf = document.getElementById('btnTaskValueOf');

function getSelectedBots() {
    const list = selectedList();
    if (!list || list.length === 0) {
        return guiSwarmManager.getAllBots();
    }
    return list.map(name => guiSwarmManager.getBot(name)).filter(Boolean);
}

// Window load
window.onload = () => {
    botApi.setMaxListeners(0);
    checkVer();
};

idBtnStart.onclick = () => {
    if (idNameMethod.value == "default" && !idBotUsername.value) {
        createPopup("Invalid Username!", "red");
        return;
    }
    const serverHost = idIp.value.split(':')[0] ? idIp.value.split(':')[0] : "localhost";
    const serverPort = parseInt(idIp.value.split(':')[1] ? idIp.value.split(':')[1] : 25565, 10);
    guiSwarmManager.host = serverHost;
    guiSwarmManager.port = serverPort;

    connectBot();
    saveData();
    idTabBot.click();
};

idBtnStop.onclick = () => { botApi.emit('stopBots'); };
idBtnDc.onclick = () => { exeAll("disconnect"); };
idBtnUse.onclick = () => { exeAll("useheld"); };
idBtnClose.onclick = () => { exeAll("closewindow"); };
idBtnSpam.onclick = () => { botApi.emit("spam", idSpamMessage.value, idSpamDelay.value); };
idBtnSpamStop.onclick = () => { botApi.emit("stopspam"); };
idBtnChat.onclick = () => { exeAll("chat", idChatMessage.value); };
idBtnSetHotbar.onclick = () => { exeAll("sethotbar", idHotbarSlot.value); };
idBtnWinClick.onclick = () => { exeAll("winclick", idBtnWinClickSlot.value, idClickWinLoR.value); };
idControlStart.onclick = () => { exeAll("startcontrol", idControlValue.value); };
idControlStop.onclick = () => { exeAll("stopcontrol", idControlValue.value); };
idBtnLookAt.onclick = () => { exeAll("look", idLookValue.value); };
idCheckSprint.onclick = () => { exeAll("sprintcheck", idCheckSprint.checked); };
idBtnDrop.onclick = () => { exeAll("drop", idDropValue.value); };
idStartScrape.onclick = () => { scrapeProxy(); };
idStartProxyCheck.onclick = () => { checkProxy(idProxylist.value); };
idBtnCheckFile.onclick = () => {
    if (!idProxyFilePath.files || !idProxyFilePath.files[0]) return createPopup("No file selected.");
    const path = fs.readFileSync(idProxyFilePath.files[0].path);
    const list = path.toString();
    checkProxy(list);
};

idBtnStartScript.onclick = () => {
    const list = selectedList();
    if (list.length === 0) return createPopup("No bot selected");
    list.forEach(name => {
        startScript(name, idScriptPath.value);
    });
};
idStartAfk.onclick = () => { exeAll('afkon'); };
idStopAfk.onclick = () => { exeAll('afkoff'); };
idBtnC.onclick = () => { saveData(); window.close(); };
idBtnM.onclick = () => { ipcRenderer.send('minimize'); };
idBtnCustomCss.onclick = () => {
    if (!idCustomCssFile.files[0]) return;
    loadTheme(idCustomCssFile.files[0].path);
    ipcRenderer.send('theme', idCustomCssFile.files[0].path);
};

idKaToggle.onclick = () => {
    if (idKaToggle.classList.contains("button-selected")) {
        idKaToggle.classList.remove("button-selected");
        botApi.emit("stopka");
    } else {
        idKaToggle.classList.add("button-selected");
        botApi.emit("toggleka", idKadelay.value);
    }
};
idAuthType.onchange = () => { checkAuth(); };

// ==========================================
// BODYGUARD TAB CONTROLS
// ==========================================
if (idBtnBgAssignSelected) {
    idBtnBgAssignSelected.onclick = () => {
        const bots = getSelectedBots();
        const boss = idBgBossTarget.value.trim() || 'Master';
        const space = parseInt(idBgPersonalSpace.value, 10) || 4;
        if (bots.length === 0) return createPopup("No bots available to bodyguard.", "red");

        bodyguardSystem.addExistingGuards(bots, boss, { personalSpace: space });
        if (idBgStatusLabel) idBgStatusLabel.innerText = `Guarding ${boss} with ${bots.length} bot(s).`;
        sendLog(`[Bodyguard] Assigned ${bots.map(b => b.username).join(', ')} to protect ${boss}`);
    };
}

if (idBtnBgAssignAll) {
    idBtnBgAssignAll.onclick = () => {
        const bots = guiSwarmManager.getAllBots();
        const boss = idBgBossTarget.value.trim() || 'Master';
        const space = parseInt(idBgPersonalSpace.value, 10) || 4;
        if (bots.length === 0) return createPopup("No bots connected.", "red");

        bodyguardSystem.addExistingGuards(bots, boss, { personalSpace: space });
        if (idBgStatusLabel) idBgStatusLabel.innerText = `Guarding ${boss} with all ${bots.length} bot(s).`;
        sendLog(`[Bodyguard] All bots are now protecting ${boss}`);
    };
}

if (idBtnBgStop) {
    idBtnBgStop.onclick = () => {
        const bots = getSelectedBots();
        const boss = idBgBossTarget.value.trim() || 'Master';
        bodyguardSystem.stopGuards(bots, boss);
        if (idBgStatusLabel) idBgStatusLabel.innerText = "Bodyguarding stopped.";
        sendLog(`[Bodyguard] Stopped bodyguard duty for ${bots.length} bot(s).`);
    };
}

if (idBtnBgSpawnNew) {
    idBtnBgSpawnNew.onclick = async () => {
        const boss = idBgBossTarget.value.trim() || 'Master';
        const count = parseInt(idBgNewCount.value, 10) || 1;
        const prefix = idBgNewPrefix.value.trim() || 'Guard';

        sendLog(`[Bodyguard] Spawning ${count} new bodyguards for ${boss}...`);
        try {
            const spawned = await bodyguardSystem.spawnNewGuards(guiSwarmManager, boss, count, prefix);
            if (idBgStatusLabel) idBgStatusLabel.innerText = `Spawned ${spawned.length} new guards for ${boss}.`;
        } catch (err) {
            sendLog(`[Bodyguard Error] ${err.message}`);
        }
    };
}

if (idBtnBgDismiss) {
    idBtnBgDismiss.onclick = () => {
        const boss = idBgBossTarget.value.trim() || 'Master';
        const prefix = idBgNewPrefix.value.trim() || null;
        const dismissed = bodyguardSystem.dismissGuards(guiSwarmManager, boss, prefix);
        sendLog(`[Bodyguard] Dismissed ${dismissed} bodyguard bot(s).`);
        if (idBgStatusLabel) idBgStatusLabel.innerText = `Dismissed ${dismissed} guard(s).`;
    };
}

if (idBtnBgAttack) {
    idBtnBgAttack.onclick = () => {
        const boss = idBgBossTarget.value.trim() || 'Master';
        const targetName = idBgAttackTarget.value.trim();
        if (!targetName) return createPopup("Enter a target name to attack.", "red");

        const bots = getSelectedBots();
        if (!bots || bots.length === 0) return createPopup("No bots available to attack.");

        const firstBot = bots[0];
        const playerToAttack = firstBot.players[targetName];
        const entity = playerToAttack ? playerToAttack.entity : firstBot.nearestEntity(e => (e.name && e.name.toLowerCase() === targetName.toLowerCase()) || (e.username && e.username.toLowerCase() === targetName.toLowerCase()));

        if (entity) {
            // Check if user has active bodyguards for this boss
            const guards = bodyguardSystem.getGuardsForBoss(boss);
            if (guards.length > 0) {
                bodyguardSystem.setTargetForGuards(boss, entity);
                sendLog(`[Bodyguard] Guards attacking target: ${targetName}`);
            }

            // Also attack directly with all selected bots independently from bodyguarding
            bots.forEach(b => {
                if (b.equipForCombat) b.equipForCombat();
                if (b.pvp && typeof b.pvp.attack === 'function') {
                    b.pvp.attack(entity);
                } else if (typeof b.attack === 'function') {
                    b.attack(entity);
                }
            });
            sendLog(`[Combat] ${bots.length} bot(s) attacking target: ${targetName}`);
            if (idCombatStatusLabel) idCombatStatusLabel.innerText = `Attacking ${targetName}...`;
            if (idBgStatusLabel) idBgStatusLabel.innerText = `Attacking ${targetName}...`;
        } else {
            createPopup(`Entity "${targetName}" not found nearby.`);
        }
    };
}

if (idBtnBgHalt) {
    idBtnBgHalt.onclick = () => {
        const boss = idBgBossTarget.value.trim() || 'Master';
        bodyguardSystem.haltGuards(boss);
        const bots = getSelectedBots();
        bots.forEach(b => {
            if (b.pvp && typeof b.pvp.stop === 'function') b.pvp.stop();
            if (b.clearTargets) b.clearTargets();
            if (b.pathfinder) b.pathfinder.setGoal(null);
        });
        sendLog(`[Combat] Halted combat and returned bodyguards to formation.`);
        if (idCombatStatusLabel) idCombatStatusLabel.innerText = `Combat halted.`;
        if (idBgStatusLabel) idBgStatusLabel.innerText = `Combat halted.`;
    };
}

// ==========================================
// PRINTERS TAB CONTROLS
// ==========================================
if (idCmdPrintMode) {
    idCmdPrintMode.onchange = () => {
        if (idCmdNewBotsRow) {
            idCmdNewBotsRow.style.display = idCmdPrintMode.value === 'new' ? 'flex' : 'none';
        }
    };
}

if (idPlacerPrintMode) {
    idPlacerPrintMode.onchange = () => {
        if (idPlacerNewBotsRow) {
            idPlacerNewBotsRow.style.display = idPlacerPrintMode.value === 'new' ? 'flex' : 'none';
        }
    };
}

if (idPrintFilePicker) {
    idPrintFilePicker.onchange = () => {
        if (idPrintFilePicker.files && idPrintFilePicker.files[0]) {
            idPrintImagePath.value = idPrintFilePicker.files[0].path;
        }
    };
}

if (idBtnGetPlayerPos) {
    idBtnGetPlayerPos.onclick = () => {
        const bots = getSelectedBots();
        if (bots.length > 0 && bots[0].entity) {
            idPrintX.value = Math.floor(bots[0].entity.position.x);
            idPrintY.value = Math.floor(bots[0].entity.position.y);
            idPrintZ.value = Math.floor(bots[0].entity.position.z);
            sendLog(`[Printers] Coordinates set to bot ${bots[0].username}'s position: ${idPrintX.value}, ${idPrintY.value}, ${idPrintZ.value}`);
        } else {
            createPopup("No bot entity position available.");
        }
    };
}

if (idBtnCmdPrintStart) {
    idBtnCmdPrintStart.onclick = async () => {
        const coords = {
            x: parseInt(idPrintX.value, 10) || 0,
            y: parseInt(idPrintY.value, 10) || 64,
            z: parseInt(idPrintZ.value, 10) || 0
        };
        const imagePath = idPrintImagePath.value.trim() || 'image.jpg';
        const delayMs = parseInt(idCmdPrintDelay.value, 10) || 5;

        if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Commands printing starting...";

        if (idCmdPrintMode.value === 'new') {
            const count = parseInt(idCmdPrintNewCount.value, 10) || 2;
            const prefix = idCmdPrintPrefix.value.trim() || 'CmdPrinter';
            commandsPrinter.printWithNewBots(guiSwarmManager, count, prefix, coords, imagePath, {
                placementDelayMs: delayMs,
                onStart: (info) => {
                    sendLog(`[CommandsPrinter] Started: ${info.totalCommands} blocks chunked across ${info.botCount} bots.`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Printing ${info.totalCommands} blocks...`;
                },
                onComplete: () => {
                    sendLog(`[CommandsPrinter] Finished successfully!`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Commands print completed.";
                }
            }).catch(e => {
                sendLog(`[CommandsPrinter Error] ${e.message}`);
                if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Error: ${e.message}`;
            });
        } else {
            const bots = idCmdPrintMode.value === 'all' ? guiSwarmManager.getAllBots() : getSelectedBots();
            if (bots.length === 0) return createPopup("No bots selected for printing.", "red");

            commandsPrinter.printWithBots(bots, coords, imagePath, {
                placementDelayMs: delayMs,
                onStart: (info) => {
                    sendLog(`[CommandsPrinter] Started with ${bots.length} bot(s): ${info.totalCommands} commands.`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Printing ${info.totalCommands} commands...`;
                },
                onComplete: () => {
                    sendLog(`[CommandsPrinter] Finished successfully!`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Commands print completed.";
                }
            }).catch(e => {
                sendLog(`[CommandsPrinter Error] ${e.message}`);
                if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Error: ${e.message}`;
            });
        }
    };
}

if (idBtnCmdPrintStop) {
    idBtnCmdPrintStop.onclick = () => {
        commandsPrinter.stop();
        sendLog("[CommandsPrinter] Printing stopped.");
        if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Printing stopped.";
    };
}

if (idBtnPlacerPrintStart) {
    idBtnPlacerPrintStart.onclick = async () => {
        const coords = {
            x: parseInt(idPrintX.value, 10) || 0,
            y: parseInt(idPrintY.value, 10) || 64,
            z: parseInt(idPrintZ.value, 10) || 0
        };
        const imagePath = idPrintImagePath.value.trim() || 'image.jpg';
        const palette = idPlacerPalette.value || 'concrete';
        const size = idPlacerDimensions.value.trim() || '32x32';

        if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Placer printing starting...";

        if (idPlacerPrintMode.value === 'new') {
            const count = parseInt(idPlacerNewCount.value, 10) || 1;
            const prefix = idPlacerPrefix.value.trim() || 'Placer';
            placerPrinter.printWithNewBots(guiSwarmManager, count, prefix, coords, imagePath, {
                palette,
                size,
                onStart: (info) => {
                    sendLog(`[PlacerPrinter] Started: ${info.totalBlocks} blocks to place.`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Placing ${info.totalBlocks} blocks...`;
                },
                onComplete: () => {
                    sendLog(`[PlacerPrinter] Finished successfully!`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Placer print completed.";
                }
            }).catch(e => {
                sendLog(`[PlacerPrinter Error] ${e.message}`);
                if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Error: ${e.message}`;
            });
        } else {
            const bots = idPlacerPrintMode.value === 'all' ? guiSwarmManager.getAllBots() : getSelectedBots();
            if (bots.length === 0) return createPopup("No bots selected for placing.", "red");

            placerPrinter.printWithBots(bots, coords, imagePath, {
                palette,
                size,
                onStart: (info) => {
                    sendLog(`[PlacerPrinter] Started with ${bots.length} bot(s): ${info.totalBlocks} blocks.`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Placing ${info.totalBlocks} blocks...`;
                },
                onComplete: () => {
                    sendLog(`[PlacerPrinter] Finished successfully!`);
                    if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Placer print completed.";
                }
            }).catch(e => {
                sendLog(`[PlacerPrinter Error] ${e.message}`);
                if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = `Error: ${e.message}`;
            });
        }
    };
}

if (idBtnPlacerPrintStop) {
    idBtnPlacerPrintStop.onclick = () => {
        placerPrinter.stop();
        sendLog("[PlacerPrinter] Placement stopped.");
        if (idPrinterStatusLabel) idPrinterStatusLabel.innerText = "Placement stopped.";
    };
}

// ==========================================
// SWARM TASKS TAB CONTROLS
// ==========================================
if (idBtnTaskCome) {
    idBtnTaskCome.onclick = () => {
        const bots = getSelectedBots();
        const targetName = idTaskPlayerTarget.value.trim() || 'Master';
        bots.forEach(bot => {
            const player = bot.players[targetName];
            if (player && player.entity) {
                const mcData = require('minecraft-data')(bot.version);
                const { Movements } = require('mineflayer-pathfinder');
                Utils.goToTarget(bot, player.entity, new Movements(bot, mcData), 0);
            }
        });
        sendLog(`[Tasks] Ordered ${bots.length} bot(s) to come to ${targetName}`);
    };
}

if (idBtnTaskFollow) {
    idBtnTaskFollow.onclick = () => {
        const bots = getSelectedBots();
        const targetName = idTaskPlayerTarget.value.trim() || 'Master';
        bots.forEach(bot => {
            const player = bot.players[targetName];
            if (player && player.entity) {
                const mcData = require('minecraft-data')(bot.version);
                const { Movements } = require('mineflayer-pathfinder');
                Utils.follow(bot, player.entity, new Movements(bot, mcData));
            }
        });
        sendLog(`[Tasks] Ordered ${bots.length} bot(s) to follow ${targetName}`);
    };
}

if (idBtnTaskGoto) {
    idBtnTaskGoto.onclick = () => {
        const bots = getSelectedBots();
        const x = parseInt(idTaskGotoX.value, 10);
        const y = parseInt(idTaskGotoY.value, 10);
        const z = parseInt(idTaskGotoZ.value, 10);
        if (isNaN(x) || isNaN(y) || isNaN(z)) return createPopup("Enter valid X, Y, Z coordinates.");

        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            Utils.goToTarget(bot, { position: { x, y, z } }, new Movements(bot, mcData), 0);
        });
        sendLog(`[Tasks] Sent ${bots.length} bot(s) to ${x}, ${y}, ${z}`);
    };
}

if (idBtnTaskSetHome) {
    idBtnTaskSetHome.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            if (bot.entity) Utils.setHome(bot, bot.entity.position);
        });
        sendLog(`[Tasks] Saved home position for ${bots.length} bot(s).`);
    };
}

if (idBtnTaskGoHome) {
    idBtnTaskGoHome.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            const home = Utils.getHome(bot);
            if (home) {
                const mcData = require('minecraft-data')(bot.version);
                const { Movements } = require('mineflayer-pathfinder');
                Utils.goToTarget(bot, { position: home }, new Movements(bot, mcData), 1);
            }
        });
        sendLog(`[Tasks] Sent ${bots.length} bot(s) home.`);
    };
}

const stopAllTasksHandler = () => {
    const bots = getSelectedBots();
    bots.forEach(bot => {
        Utils.stop(bot);
        bodyguardSystem.stopGuards(bot);
    });
    commandsPrinter.stop();
    placerPrinter.stop();
    sendLog(`[Tasks] Stopped all tasks on ${bots.length} bot(s).`);
};
if (idBtnTaskStopAll) idBtnTaskStopAll.onclick = stopAllTasksHandler;
if (idBtnTaskStopHarvest) idBtnTaskStopHarvest.onclick = stopAllTasksHandler;
if (idBtnTaskStopAuto) idBtnTaskStopAuto.onclick = stopAllTasksHandler;

if (idBtnTaskHarvest) {
    idBtnTaskHarvest.onclick = () => {
        const bots = getSelectedBots();
        const blockName = idTaskBlockName.value.trim() || 'oak_log';
        const count = parseInt(idTaskBlockCount.value, 10) || 5;

        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            Utils.harvest(bot, blockName, new Movements(bot, mcData), count, mcData, (msg) => {
                sendLog(`[Harvest: ${bot.username}] ${msg}`);
            });
        });
        sendLog(`[Tasks] Harvesting ${count}x ${blockName} with ${bots.length} bot(s).`);
    };
}

if (idBtnTaskCraft) {
    idBtnTaskCraft.onclick = () => {
        const bots = getSelectedBots();
        const itemName = idTaskCraftName.value.trim() || 'stick';
        const count = parseInt(idTaskCraftCount.value, 10) || 4;

        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            let table = bot.findBlockSync ? bot.findBlockSync({ matching: 'crafting_table', point: bot.entity.position, maxDistance: 16 })[0] : null;
            Utils.craft(bot, itemName, mcData, count, table, (err) => {
                if (err) sendLog(`[Craft: ${bot.username}] Error: ${err}`);
                else sendLog(`[Craft: ${bot.username}] Crafted ${count}x ${itemName}!`);
            });
        });
    };
}

if (idBtnTaskHunt) {
    idBtnTaskHunt.onclick = () => {
        const bots = getSelectedBots();
        const count = parseInt(idTaskHuntCount.value, 10) || 3;
        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            Utils.hunt(bot, new Movements(bot, mcData), count, 30, () => {
                sendLog(`[Hunt: ${bot.username}] Hunt finished.`);
            });
        });
        sendLog(`[Tasks] Hunting ${count} animals with ${bots.length} bot(s).`);
    };
}

if (idBtnTaskCollect) {
    idBtnTaskCollect.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            Utils.collectDrops(bot, new Movements(bot, mcData), 30, () => {
                sendLog(`[Collect: ${bot.username}] Collected nearby drops.`);
            });
        });
        sendLog(`[Tasks] Collecting drops with ${bots.length} bot(s).`);
    };
}

if (idBtnTaskDropItem) {
    idBtnTaskDropItem.onclick = () => {
        const bots = getSelectedBots();
        const itemName = idTaskDropItem.value.trim();
        bots.forEach(bot => {
            const item = bot.inventory.items().find(i => i.name.includes(itemName));
            if (item) bot.tossStack(item);
        });
        sendLog(`[Tasks] Dropped ${itemName} from ${bots.length} bot(s).`);
    };
}

if (idBtnTaskRelMove) {
    idBtnTaskRelMove.onclick = () => {
        const bots = getSelectedBots();
        const dx = parseInt(idTaskRelX ? idTaskRelX.value : '0', 10) || 0;
        const dy = parseInt(idTaskRelY ? idTaskRelY.value : '0', 10) || 0;
        const dz = parseInt(idTaskRelZ ? idTaskRelZ.value : '5', 10) || 0;
        bots.forEach(bot => {
            if (bot.entity) {
                const targetPos = bot.entity.position.offset(dx, dy, dz);
                const mcData = require('minecraft-data')(bot.version);
                const { Movements } = require('mineflayer-pathfinder');
                Utils.goToTarget(bot, { position: targetPos }, new Movements(bot, mcData), 1);
            }
        });
        sendLog(`[Tasks] Moving ${bots.length} bot(s) relative by (${dx}, ${dy}, ${dz}).`);
    };
}

if (idBtnTaskHole) {
    idBtnTaskHole.onclick = () => {
        const bots = getSelectedBots();
        const dimStr = (idTaskHoleDim ? idTaskHoleDim.value : '5x5x3').trim();
        const parts = dimStr.split('x').map(n => parseInt(n, 10));
        const W = parts[0] || 5;
        const L = parts[1] || 5;
        const D = parts[2] || 3;
        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            Utils.hole(bot, W, L, D, new Movements(bot, mcData), () => {
                sendLog(`[Tasks: ${bot.username}] Completed digging ${W}x${L}x${D} hole.`);
            });
        });
        sendLog(`[Tasks] Started digging hole ${W}x${L}x${D} with ${bots.length} bot(s).`);
    };
}

if (idBtnTaskEquip) {
    idBtnTaskEquip.onclick = async () => {
        const bots = getSelectedBots();
        const itemName = idTaskEquipName ? idTaskEquipName.value.trim() : '';
        if (!itemName) return createPopup('Enter an item name to equip.');
        for (const bot of bots) {
            const res = await Utils.equipByName(bot, itemName);
            sendLog(`[Tasks: ${bot.username}] Equip ${itemName}: ${res ? 'success' : 'not found / failed'}`);
        }
    };
}

if (idBtnTaskNearby) {
    idBtnTaskNearby.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            const counts = Utils.nearbyBlocks(bot, 16);
            const summary = Object.entries(counts).slice(0, 8).map(([b, c]) => `${b}: ${c}`).join(', ');
            sendLog(`[Nearby: ${bot.username}] Found: ${summary || 'None'}`);
        });
    };
}

if (idBtnTaskLocate) {
    idBtnTaskLocate.onclick = () => {
        const bots = getSelectedBots();
        const target = (idTaskLocateTarget ? idTaskLocateTarget.value : '').trim();
        if (!target) return createPopup('Enter a player or entity name to locate.');
        bots.forEach(bot => {
            const foundPlayer = bot.players[target];
            if (foundPlayer && foundPlayer.entity) {
                const pos = foundPlayer.entity.position;
                sendLog(`[Locate: ${bot.username}] Found player ${target} at (${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)})`);
                return;
            }
            const foundEntity = Object.values(bot.entities).find(e => e.name === target || e.username === target);
            if (foundEntity) {
                const pos = foundEntity.position;
                sendLog(`[Locate: ${bot.username}] Found entity ${target} at (${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)})`);
            } else {
                sendLog(`[Locate: ${bot.username}] Could not find ${target}.`);
            }
        });
    };
}

if (idBtnTaskProtect) {
    idBtnTaskProtect.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            const mcData = require('minecraft-data')(bot.version);
            const { Movements } = require('mineflayer-pathfinder');
            Utils.attackNearestMob(bot, new Movements(bot, mcData), 16);
        });
        sendLog(`[Tasks] Sent ${bots.length} bot(s) to protect area and attack hostiles.`);
    };
}

if (idBtnTaskGuardPos) {
    idBtnTaskGuardPos.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            if (bot.entity) {
                bot.guardPos = bot.entity.position.clone();
                bot.state = 'guarding';
                const mcData = require('minecraft-data')(bot.version);
                const { Movements } = require('mineflayer-pathfinder');
                Utils.guardArea(bot, bot.guardPos, new Movements(bot, mcData));
            }
        });
        sendLog(`[Tasks] Guarding current positions with ${bots.length} bot(s).`);
    };
}

if (idBtnTaskLearn) {
    idBtnTaskLearn.onclick = () => {
        const bots = getSelectedBots();
        const targetName = (idTaskPlayerTarget ? idTaskPlayerTarget.value : '').trim() || 'Master';
        bots.forEach(bot => {
            const player = bot.players[targetName];
            Utils.learn(bot, player);
        });
        sendLog(`[Tasks] Started learning block modifications near ${targetName}.`);
    };
}

if (idBtnTaskRecite) {
    idBtnTaskRecite.onclick = () => {
        const bots = getSelectedBots();
        bots.forEach(bot => {
            Utils.finishLearn(bot);
        });
        sendLog(`[Tasks] Stopped learning and recited blocks for ${bots.length} bot(s).`);
    };
}

if (idBtnTaskRemember) {
    idBtnTaskRemember.onclick = () => {
        const bots = getSelectedBots();
        const key = idTaskMemoryKey ? idTaskMemoryKey.value.trim() : '';
        const val = idTaskMemoryVal ? idTaskMemoryVal.value.trim() : '';
        if (!key) return createPopup('Enter a key to remember.');
        bots.forEach(bot => {
            if (!bot.memory) bot.memory = {};
            bot.memory[key] = val;
        });
        sendLog(`[Memory] Set ${key} = ${val} on ${bots.length} bot(s).`);
    };
}

if (idBtnTaskValueOf) {
    idBtnTaskValueOf.onclick = () => {
        const bots = getSelectedBots();
        const key = idTaskMemoryKey ? idTaskMemoryKey.value.trim() : '';
        if (!key) return createPopup('Enter a key to query.');
        bots.forEach(bot => {
            const val = bot.memory ? bot.memory[key] : undefined;
            sendLog(`[Memory: ${bot.username}] ${key} = ${val !== undefined ? val : '<undefined>'}`);
        });
    };
}

// ==========================================
// BOT CREATION & LIFECYCLE
// ==========================================
async function newBot(options) {
    const bot = createBot(options);

    // Initialize unified plugins and systems on this bot
    initBot(bot, {
        password: 'Password',
        master: ['Master', idBotUsername ? idBotUsername.value : 'Master'],
        role: 'guiBot'
    });

    let afkLoaded = false;
    await bot.once('login', () => {
        guiSwarmManager.botsMap.set(bot.username, bot);
        botApi.emit("login", bot.username);

        botApi.once(bot.username + 'disconnect', () => { bot.quit(); });
        botApi.once(bot.username + 'reconnect', () => { newBot(options); });
        botApi.on(bot.username + 'useheld', () => { bot.activateItem(); });
        botApi.on(bot.username + 'closewindow', () => { bot.closeWindow(bot.currentWindow); });
        botApi.on(bot.username + 'chat', (o) => {
            if (idCheckAntiSpam && idCheckAntiSpam.checked) {
                bot.chat(o.toString().replaceAll("(SALT)", salt(4)) + " " + salt(antiSpamLength.value ? antiSpamLength.value : 5));
            } else {
                bot.chat(o.toString().replaceAll("(SALT)", salt(4)));
            }
        });
        botApi.on(bot.username + 'sethotbar', (o) => { bot.setQuickBarSlot(o); });
        botApi.on(bot.username + 'winclick', (o, i) => {
            if (i == 0) { bot.clickWindow(o, 0, 0); } else { bot.clickWindow(o, 1, 0); }
        });
        botApi.on(bot.username + 'stopcontrol', (o) => { bot.setControlState(o, false); });
        botApi.on(bot.username + 'look', (o) => { bot.look(o, 0); });
        botApi.on(bot.username + 'sprintcheck', (o) => { bot.setControlState('sprint', o); });
        botApi.on(bot.username + 'startscript', () => { startScript(bot.username, idScriptPath.value); });
        if (idScriptCheck && idScriptCheck.checked) { startScript(bot.username, idScriptPath.value); }

        botApi.on(bot.username + 'afkon', () => {
            if (!afkLoaded) {
                afkLoaded = true;
                bot.loadPlugin(antiafk);
                bot.afk.start();
            } else {
                bot.afk.start();
            }
        });
        botApi.on(bot.username + 'afkoff', () => { bot.afk.stop(); });

        botApi.on(bot.username + 'drop', (o) => {
            if (o) {
                bot.clickWindow(o, 0, 0);
                bot.clickWindow(-999, 0, 0);
            } else {
                (async () => {
                    const itemCount = bot.inventory.items().length;
                    for (var i = 0; i < itemCount; i++) {
                        if (bot.inventory.items().length === 0) return;
                        const item = bot.inventory.items()[0];
                        bot.tossStack(item);
                        await delay(10);
                    }
                })();
            }
        });

        botApi.on(bot.username + 'startcontrol', (o) => {
            bot.setControlState(o, true);
            if (idCheckSprint && idCheckSprint.checked === true) { bot.setControlState('sprint', true); } else { bot.setControlState('sprint', false); }
        });

        idBtnRc.addEventListener('click', () => { botApi.emit(bot.username + 'reconnect'); });

        botApi.on(bot.username + 'hit', () => {
            const entities = Object.values(bot.entities);
            entities.forEach((entity) => {
                if (!entity || !entity.position) return;
                const distance = bot.entity.position.distanceTo(entity.position);
                if (distance <= (idKarange.value || 4)) {
                    if (entity.kind === "Hostile mobs" && idTmob.checked) {
                        if (idKaLook.checked) { bot.lookAt(entity.position, true); }
                        bot.attack(entity);
                    }
                    if (entity.kind === "Passive mobs" && idTanimal.checked) {
                        if (idKaLook.checked) { bot.lookAt(entity.position, true); }
                        bot.attack(entity);
                    }
                    if (entity.kind === "Vehicles" && idTvehicle.checked) {
                        if (idKaLook.checked) { bot.lookAt(entity.position, true); }
                        bot.attack(entity);
                    }
                    if (entity.type === "player" && entity.username !== bot.username && idTplayer.checked) {
                        const list = selectedList();
                        if (list.includes(entity.username) && idCheckIgnoreFriends.checked) return;
                        if (idKaLook.checked) { bot.lookAt(entity.position, true); }
                        bot.attack(entity);
                    }
                }
            });
        });
    });

    bot.once('spawn', () => {
        botApi.emit("spawn", bot.username);
        if (idJoinMessage && idJoinMessage.value) { bot.chat(idJoinMessage.value); }
    });

    bot.once('kicked', (reason) => {
        guiSwarmManager.botsMap.delete(bot.username);
        botApi.emit("kicked", bot.username, reason);
    });

    bot.once('end', (reason) => {
        guiSwarmManager.botsMap.delete(bot.username);
        botApi.emit("end", bot.username, reason);
        if (idCheckAutoRc && idCheckAutoRc.checked === true) {
            recon();
            async function recon() {
                await delay(idReconDelay.value);
                newBot(options);
            }
        }
    });

    bot.once('error', (err) => {
        botApi.emit("error", bot.username, err);
    });

    bot.on('messagestr', (message) => {
        if (!message) return;
        if (idShowChatCheck && idShowChatCheck.checked) {
            sendLog(`[${bot.username}] ${message}`);
        }
    });

    bot.on('windowOpen', () => {
        sendLog(`[${bot.username}] Window opened`);
    });

    bot.on('death', function () {
        botApi.emit('death', bot.username);
        bot.once('respawn', function () {
            if (idCheckOnDeath && idCheckOnDeath.checked && idScriptPath.value) { startScript(bot.username, idScriptPath.value); }
        });
    });

    bot.on('respawn', function () {
        botApi.emit('respawn', bot.username);
        if (idCheckOnRespawn && idCheckOnRespawn.checked && idScriptPath.value) { startScript(bot.username, idScriptPath.value); }
    });
}

botApi.on('toggleka', (dl) => {
    botApi.once('stopka', () => { clearInterval(katoggle); });
    var katoggle = setInterval(() => {
        exeAll('hit');
    }, dl ? dl : 500);
});

botApi.on('spam', (msg, dl) => {
    botApi.once('stopspam', () => { clearInterval(chatSpam); });
    var chatSpam = setInterval(() => {
        exeAll("chat", msg);
    }, dl ? dl : 1000);
});

botApi.on("login", (name) => {
    addPlayer(name);
    sendLog(`<li> <img src="./assets/icons/arrow-right.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(68%) sepia(74%) saturate(5439%) hue-rotate(86deg) brightness(128%) contrast(114%)"> ${name} Logged in.</li>`);
});
botApi.on("end", (name, reason) => {
    rmPlayer(name);
    sendLog(`<li> <img src="./assets/icons/alert-triangle.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(100%) sepia(61%) saturate(4355%) hue-rotate(357deg) brightness(104%) contrast(104%)"> [${name}] ${reason}</li>`);
});
botApi.on("error", (name, err) => {
    errBot(name);
    sendLog(`<li> <img src="./assets/icons/alert-triangle.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(89%) sepia(82%) saturate(799%) hue-rotate(1deg) brightness(103%) contrast(102%)"> [${name}] ${err}</li>`);
});
botApi.on("spawn", (name) => {
    sendLog(`<li> <img src="./assets/icons/arrow-right.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(26%) sepia(94%) saturate(5963%) hue-rotate(74deg) brightness(96%) contrast(101%)"> ${name} Spawned.</li>`);
});
botApi.on("death", (name) => {
    sendLog(`<li> <img src="./assets/icons/arrow-right.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(26%) sepia(94%) saturate(5963%) hue-rotate(74deg) brightness(96%) contrast(101%)"> ${name} Died.</li>`);
});
botApi.on("respawn", (name) => {
    sendLog(`<li> <img src="./assets/icons/arrow-right.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(26%) sepia(94%) saturate(5963%) hue-rotate(74deg) brightness(96%) contrast(101%)"> ${name} Respawned.</li>`);
});
botApi.on("kicked", (name, reason) => {
    rmPlayer(name);
    try {
        sendLog(`<li> <img src="./assets/icons/arrow-left.svg" class="icon-sm" style="filter: brightness(0) saturate(100%) invert(11%) sepia(92%) saturate(6480%) hue-rotate(360deg) brightness(103%) contrast(113%)"> [${name}] : ${formatText(JSON.parse(reason))}</li>`);
    } catch (e) {
        sendLog(`<li> [${name}] : ${reason}</li>`);
    }
});

// Uptime counter
idBtnStart.addEventListener('click', () => {
    currentTime = Date.now();
    idBtnStart.addEventListener('click', () => {
        clearInterval(botUptime);
        idUptime.innerHTML = getTime(currentTime);
    });

    let botUptime = setInterval(() => {
        idUptime.innerHTML = getTime(currentTime);
    }, 1000);
});

function getTime(from) {
    const calc = Date.now() - from;
    return convertTime((calc / 1000).toFixed());
}
function convertTime(number) {
    return `${formatTime(Math.floor(number / 60))}:${formatTime(number % 60)}`;
}
function formatTime(time) {
    if (10 > time) return "0" + time;
    return time;
}

// Config restore & save
ipcRenderer.on('restore', (event, data) => {
    if (!data) return;
    Object.keys(data).forEach(v => {
        const el = document.getElementById(v);
        if (el) el.value = data[v];
    });
    checkAuth();
});

ipcRenderer.on('restoreTheme', (event, themePath) => {
    loadTheme(themePath);
});

function saveData() {
    ipcRenderer.send('config', (event, {
        "botUsename": document.getElementById('botUsename') ? document.getElementById('botUsename').value : '',
        "botAuthType": document.getElementById('botAuthType') ? document.getElementById('botAuthType').value : '',
        "botConnectIp": document.getElementById('botConnectIp') ? document.getElementById('botConnectIp').value : '',
        "botversion": document.getElementById('botversion') ? document.getElementById('botversion').value : '',
        "botCount": document.getElementById('botCount') ? document.getElementById('botCount').value : '',
        "joinDelay": document.getElementById('joinDelay') ? document.getElementById('joinDelay').value : '',
        "joinMessage": document.getElementById('joinMessage') ? document.getElementById('joinMessage').value : '',
        'scriptPath': document.getElementById('scriptPath') ? document.getElementById('scriptPath').value : ''
    }));
}
