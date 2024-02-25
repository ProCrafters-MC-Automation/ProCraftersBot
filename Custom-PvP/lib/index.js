"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shot = exports.defaultPlugin = exports.getPlugin = void 0;
const mineflayer_trajectories_1 = require("@nxg-org/mineflayer-trajectories");
Object.defineProperty(exports, "Shot", { enumerable: true, get: function () { return mineflayer_trajectories_1.Shot; } });
const mineflayer_util_plugin_1 = __importDefault(require("@nxg-org/mineflayer-util-plugin"));
const mineflayer_tracker_1 = __importDefault(require("@nxg-org/mineflayer-tracker"));
const mineflayer_jump_pathing_1 = __importDefault(require("@nxg-org/mineflayer-jump-pathing"));
const swordPvp_1 = require("./sword/swordPvp");
const bowpvp_1 = require("./bow/bowpvp");
const swordconfigs_1 = require("./sword/swordconfigs");
function getPlugin(swordConfig = {}, bowConfig = {}) {
    let sConfig = Object.assign(swordconfigs_1.defaultSwordConfig, swordConfig);
    let bConfig = Object.assign(bowpvp_1.defaultBowConfig, bowConfig);
    return (bot) => {
        if (!bot.hasPlugin(mineflayer_util_plugin_1.default))
            bot.loadPlugin(mineflayer_util_plugin_1.default);
        if (!bot.hasPlugin(mineflayer_tracker_1.default))
            bot.loadPlugin(mineflayer_tracker_1.default);
        if (!bot.hasPlugin(mineflayer_jump_pathing_1.default))
            bot.loadPlugin(mineflayer_jump_pathing_1.default);
        bot.swordpvp = new swordPvp_1.SwordPvp(bot, sConfig);
        bot.bowpvp = new bowpvp_1.BowPVP(bot, bConfig);
    };
}
exports.getPlugin = getPlugin;
function defaultPlugin(bot) {
    if (!bot.hasPlugin(mineflayer_util_plugin_1.default))
        bot.loadPlugin(mineflayer_util_plugin_1.default);
    if (!bot.hasPlugin(mineflayer_tracker_1.default))
        bot.loadPlugin(mineflayer_tracker_1.default);
    if (!bot.hasPlugin(mineflayer_jump_pathing_1.default))
        bot.loadPlugin(mineflayer_jump_pathing_1.default);
    bot.swordpvp = new swordPvp_1.SwordPvp(bot);
    bot.bowpvp = new bowpvp_1.BowPVP(bot);
}
exports.defaultPlugin = defaultPlugin;
