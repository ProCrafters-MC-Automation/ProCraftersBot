"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mineflayer_1 = require("mineflayer");
const PVPPlugin = __importStar(require("./index"));
const mineflayer_trajectories_1 = require("@nxg-org/mineflayer-trajectories");
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
let target = null;
let defend = false;
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//     prompt: "Text here: ",
// });
class KillBot {
    constructor(num) {
        var _a, _b;
        this.fight = () => __awaiter(this, void 0, void 0, function* () {
            target = this.bot.nearestEntity((e) => { var _a; return e.type === "player" && !((_a = e.username) === null || _a === void 0 ? void 0 : _a.includes("pvp-testing")); });
            if (!target) {
                this.bot.chat("No target found.");
                this.bot.off("physicsTick", this.fight);
                return;
            }
            this.equipShield();
            this.bot.swordpvp.attack(target);
        });
        this.bot = (0, mineflayer_1.createBot)({
            username: "pvp-testing" + num,
            host: (_a = process.argv[3]) !== null && _a !== void 0 ? _a : "localhost",
            port: (_b = Number(process.argv[4])) !== null && _b !== void 0 ? _b : 25565,
            version: process.argv[5],
        });
        let pvp = PVPPlugin.getPlugin({
            swingConfig: {
                mode: "fullswing",
            },
            tapConfig: {
                enabled: true,
                mode: "stap",
                delay: 3,
            },
            critConfig: {
                enabled: true,
                mode: "hop",
            },
            kbCancelConfig: {
                enabled: true,
                mode: {
                    name: "velocity",
                    hRatio: 0,
                    yRatio: 0,
                    // name: "jump"
                },
            },
            followConfig: {
                mode: "jump",
                distance: 3,
            },
            rotateConfig: {
                enabled: true,
                mode: "constant",
            },
        });
        this.bot.loadPlugin(pvp);
        this.bot.once("spawn", () => __awaiter(this, void 0, void 0, function* () {
            this.bot.jumpPather.searchDepth = 10;
            const moves = new mineflayer_pathfinder_1.Movements(this.bot);
            moves.allowFreeMotion = true;
            moves.allowParkour = true;
            moves.allowSprinting = true;
            this.bot.swordpvp.options.followConfig.mode = "standard";
            this.bot.pathfinder.setMovements(moves);
            this.bot.physics.yawSpeed = 50;
            // this.bot.swordpvp.options.critConfig.mode = "packet";
            this.bot.bowpvp.options.useOffhand = false;
        }));
        const checkedEntities = {};
        this.bot.on("physicsTick", () => {
            if (!defend)
                return;
            const info = this.bot.projectiles.isAimedAt;
            if (info) {
                this.bot.lookAt(info.entity.position.offset(0, 1.6, 0), true);
                if (!this.bot.util.entity.isOffHandActive())
                    this.bot.activateItem(true);
            }
            else {
                // this.bot.deactivateItem();
            }
        });
        this.bot.on("entityMoved", (entity) => __awaiter(this, void 0, void 0, function* () {
            if (!defend)
                return;
            if (!Object.keys(mineflayer_trajectories_1.projectileGravity).includes(entity.name))
                return;
            // console.log(Object.values(this.bot.entities))
            if (this.bot.projectiles.projectileAtMe) {
                this.bot.lookAt(this.bot.projectiles.projectileAtMe.entity.position, true);
                // equipShield();
                if (!this.bot.util.entity.isOffHandActive())
                    this.bot.activateItem(true);
            }
            else if (!this.bot.projectiles.isAimedAt) {
                this.bot.deactivateItem();
            }
        }));
        // this.bot.on("entityMoved", async (entity) => {
        //     if (checkedEntities[entity.id]) return;
        //     checkedEntities[entity.id] = entity;
        //     if (["arrow", "firework_rocket", "ender_pearl"].includes(entity.name!)) {
        //         console.log(this.bot.tracker.getIncomingArrows())
        //     }
        // });
        this.bot.setMaxListeners(100);
        this.bot.on("kicked", console.log);
        this.bot.on("end", console.log);
        this.bot.on("message", (message) => {
            var _a, _b;
            if (message.json.translate === "chat.type.text")
                return;
            if ((_b = (_a = message.json.extra) === null || _a === void 0 ? void 0 : _a[3]) === null || _b === void 0 ? void 0 : _b.text.includes("wants to duel you in")) {
                this.bot.chat("/duel accept");
            }
        });
        // rl.on("line", this.bot.chat)
        this.bot.on("chat", (username, message) => __awaiter(this, void 0, void 0, function* () {
            const split = message.split(" ");
            switch (split[0]) {
                case "kit":
                    this.bot.chat("/kit claim Nethpot");
                    break;
                case "partyme":
                    this.bot.chat("/party join " + username);
                    break;
                case "bow":
                case "crossbow":
                case "trident":
                case "ender_pearl":
                case "splash_potion":
                case "snowball":
                case "egg":
                case "crossbow_firework":
                    this.bot.bowpvp.stop();
                    target = this.bot.nearestEntity((e) => { var _a; return ((_a = e.username) !== null && _a !== void 0 ? _a : e.name) === split[1]; });
                    if (!target)
                        return;
                    this.bot.bowpvp.attack(target, split[0]);
                    break;
                case "sword":
                    this.bot.on("physicsTick", this.fight);
                    // target = this.bot.nearestEntity((e) => (e.username ?? e.name) === split[1]) ?? this.bot.nearestEntity((e) => e.type === "player" && !e.username?.includes("pvp-testing"));
                    // this.bot.util.move.followEntityWithRespectRange(target, 2);
                    break;
                case "rangestop":
                    this.bot.bowpvp.stop();
                    break;
                case "swordstop":
                    this.bot.swordpvp.stop();
                    this.bot.removeListener("physicsTick", this.fight);
                    break;
                case "clear":
                    console.clear();
                    break;
                case "defend":
                    defend = true;
                    this.equipShield();
                    break;
                case "defendstop":
                    defend = false;
                    break;
                case "packetmode":
                    switch (split[1]) {
                        case "enable":
                            this.bot.swordpvp.options.critConfig.enabled = true;
                            break;
                        case "disable":
                            this.bot.swordpvp.options.critConfig.enabled = false;
                            break;
                        default:
                            this.bot.swordpvp.options.critConfig.mode = split[1];
                            break;
                    }
                    break;
                case "shieldmode":
                    switch (split[1]) {
                        case "enable":
                            this.bot.swordpvp.options.shieldConfig.enabled = true;
                            break;
                        case "disable":
                            this.bot.swordpvp.options.shieldConfig.enabled = false;
                            break;
                        default:
                            this.bot.swordpvp.options.shieldConfig.mode = split[1];
                            break;
                    }
                    break;
                case "pos":
                    this.bot.chat(`${this.bot.entity.position}`);
                    break;
                case "dist":
                    target = this.bot.nearestEntity((e) => { var _a, _b; return ((_a = e.username) !== null && _a !== void 0 ? _a : e.name) === split[1] || ((_b = e.username) !== null && _b !== void 0 ? _b : e.name) === username; });
                    if (!target)
                        return;
                    this.bot.chat(`${this.bot.entity.position.distanceTo(target.position)}`);
                    break;
            }
        }));
    }
    equipShield() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.bot.entity.equipment[1]) === null || _a === void 0 ? void 0 : _a.name) === "shield")
                return;
            const shield = this.bot.util.inv.getAllItemsExceptCurrent("off-hand").find((e) => e.name === "shield");
            if (shield) {
                yield this.bot.util.inv.customEquip(shield, "off-hand");
            }
        });
    }
}
new KillBot(0);
