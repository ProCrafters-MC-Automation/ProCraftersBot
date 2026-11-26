"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopFollow = exports.followEntity = exports.goalEquals = exports.generateGoal = void 0;
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const vec3_1 = require("vec3");
// import { GoalFactory } from "@nxg-org/mineflayer-jump-pathing";
class PredictiveGoal extends mineflayer_pathfinder_1.goals.GoalFollow {
    constructor(bot, entity, range, predictTicks) {
        super(entity, range);
        this.bot = bot;
        this.predictTicks = predictTicks;
        this.bot.tracker.trackEntity(entity);
    }
    heuristic(node) {
        const dx = this.x - node.x;
        const dy = this.y - node.y;
        const dz = this.z - node.z;
        return this.distanceXZ(dx, dz) + Math.abs(dy);
    }
    isEnd(node) {
        const dx = this.x - node.x;
        const dy = this.y - node.y;
        const dz = this.z - node.z;
        return dx * dx + dy * dy + dz * dz <= this.rangeSq;
    }
    hasChanged() {
        const pos = this.entity.position.floored();
        const p = this.predictiveFunction(this.entity.position.minus(this.bot.entity.position), this.entity.position, this.bot.tracker.getEntitySpeed(this.entity) || new vec3_1.Vec3(0, 0, 0));
        const dx = this.x - p.x;
        const dy = this.y - p.y;
        const dz = this.z - p.z;
        if (dx * dx + dy * dy + dz * dz > this.rangeSq) {
            this.x = p.x;
            this.y = p.y;
            this.z = p.z;
            return true;
        }
        return false;
    }
    predictiveFunction(delta, pos, vel) {
        const base = Math.round(Math.sqrt(delta.x ** 2 + delta.y ** 2 + delta.z ** 2));
        const tickCount = Math.round((base * this.predictTicks) / Math.sqrt(base));
        return pos.plus(vel.scaled(isNaN(tickCount) ? 0 : tickCount));
    }
    distanceXZ(dx, dz) {
        dx = Math.abs(dx);
        dz = Math.abs(dz);
        return Math.abs(dx - dz) + Math.min(dx, dz) * Math.SQRT2;
    }
}
function generateGoal(bot, entity, options) {
    switch (options.followConfig.mode) {
        case "jump": {
            // const tmp1 = GoalFactory.predictEntity(
            //   bot,
            //   entity,
            //   options.followConfig.distance,
            //   options.followConfig.predict ? options.followConfig.predictTicks ?? 4 : 0
            // );
            // bot.jumpPather.goto(tmp1);
            // return tmp1;
            break;
        }
        case "standard": {
            const tmp2 = new PredictiveGoal(bot, entity, options.followConfig.distance, options.followConfig.predictTicks ?? 0);
            return tmp2;
        }
        case "custom": {
            return options.followConfig.goal(bot, entity, options);
        }
    }
}
exports.generateGoal = generateGoal;
function goalEquals(bot, currentGoal, goal, options) {
    if (currentGoal == null || goal == null)
        return false;
    switch (options.followConfig.mode) {
        case "jump": {
            return true;
        }
        case "standard": {
            const oGoal1 = currentGoal;
            const goal1 = goal;
            if (oGoal1 instanceof mineflayer_pathfinder_1.goals.GoalFollow || oGoal1 instanceof PredictiveGoal) {
                return oGoal1.entity === goal.entity && oGoal1.x === goal.x && oGoal1.z === goal.z && oGoal1.y === goal.y && oGoal1.rangeSq === goal.rangeSq;
            }
            else {
                return oGoal1 === goal;
            }
        }
        case "custom": {
            const oGoal1 = currentGoal;
            const goal1 = goal;
            if (oGoal1 instanceof mineflayer_pathfinder_1.goals.GoalFollow || oGoal1 instanceof PredictiveGoal) {
                return oGoal1.entity === goal.entity && oGoal1.x === goal.x && oGoal1.z === goal.z && oGoal1.y === goal.y && oGoal1.rangeSq === goal.rangeSq;
            }
            else {
                return oGoal1 === goal;
            }
        }
    }
    return false;
}
exports.goalEquals = goalEquals;
function followEntity(bot, goal, options) {
    switch (options.followConfig.mode) {
        case "jump": {
            break;
        }
        case "standard": {
            bot.pathfinder.setGoal(goal, true);
            break;
        }
        case "custom": {
            bot.pathfinder.setGoal(goal, true);
            break;
        }
    }
    return goal;
}
exports.followEntity = followEntity;
function stopFollow(bot, mode) {
    // bot.jumpPather.stop();
    bot.pathfinder.stop();
}
exports.stopFollow = stopFollow;
