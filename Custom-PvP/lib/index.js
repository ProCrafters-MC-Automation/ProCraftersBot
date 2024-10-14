"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shot = void 0;
const mineflayer_trajectories_1 = require("@nxg-org/mineflayer-trajectories");
Object.defineProperty(exports, "Shot", { enumerable: true, get: function () { return mineflayer_trajectories_1.Shot; } });
const mineflayer_util_plugin_1 = __importDefault(require("@nxg-org/mineflayer-util-plugin"));
const mineflayer_tracker_1 = __importDefault(require("@nxg-org/mineflayer-tracker"));
// import jumpPathing from "@nxg-org/mineflayer-jump-pathing";
const swordpvp_1 = require("./sword/swordpvp");
const bowpvp_1 = require("./bow/bowpvp");
function plugin(bot) {
    if (!bot.util)
        bot.loadPlugin(mineflayer_util_plugin_1.default);
    if (!bot.tracker || !bot.projectiles)
        bot.loadPlugin(mineflayer_tracker_1.default);
    // if (!bot.jumpPather) bot.loadPlugin(jumpPathing)
    bot.swordpvp = new swordpvp_1.SwordPvp(bot);
    bot.bowpvp = new bowpvp_1.BowPVP(bot);
}
exports.default = plugin;
