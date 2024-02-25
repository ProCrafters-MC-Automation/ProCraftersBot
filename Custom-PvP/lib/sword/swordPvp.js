"use strict";
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
exports.SwordPvp = void 0;
const util_1 = require("util");
const mathUtilts_1 = require("../calc/mathUtilts");
const util_2 = require("../util");
const sworddata_1 = require("./sworddata");
const swordconfigs_1 = require("./swordconfigs");
const mineflayer_util_plugin_1 = require("@nxg-org/mineflayer-util-plugin");
const stream_1 = require("stream");
const vec3_1 = require("vec3");
const swordutil_1 = require("./swordutil");
const { getEntityAABB } = mineflayer_util_plugin_1.AABBUtils;
const sleep = (0, util_1.promisify)(setTimeout);
const PI = Math.PI;
const TWO_PI = Math.PI * 2;
const PI_OVER_3 = Math.PI / 3;
const DEGREES_135 = (0, mathUtilts_1.toRadians)(135);
const DEFAULT_SPEED = new vec3_1.Vec3(0, 0, 0);
/**
 * The main pvp manager plugin class.
 */
class SwordPvp extends stream_1.EventEmitter {
    constructor(bot, options = swordconfigs_1.defaultSwordConfig) {
        super();
        this.bot = bot;
        this.options = options;
        this.timeToNextAttack = 0;
        this.ticksSinceTargetAttack = 0;
        this.ticksSinceLastHurt = 0;
        this.ticksSinceLastTargetHit = 0;
        this.ticksSinceLastSwitch = 0;
        this.wasInRange = false;
        this.weaponOfChoice = "sword";
        this.firstHit = true;
        this.tickOverride = false;
        this.targetShielding = false;
        this.strafeCounter = 0;
        this.checkForShield = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.target)
                return;
            if (!this.options.shieldDisableConfig.enabled)
                return;
            if (this.target.metadata[8] === 3 && ((_a = this.target.equipment[1]) === null || _a === void 0 ? void 0 : _a.name) === "shield") {
                if (!this.targetShielding)
                    this.ticksSinceLastSwitch = 0;
                this.targetShielding = true;
                if (this.ticksSinceTargetAttack >= 3 && this.ticksSinceLastSwitch >= 3) {
                    // if (this.weaponOfChoice === "_axe") return; //assume already attacking
                    const itemToChangeTo = yield this.checkForWeapon("_axe");
                    if (itemToChangeTo) {
                        const switched = yield this.equipWeapon(itemToChangeTo);
                        if (switched) {
                            this.weaponOfChoice = "_axe";
                            this.tickOverride = true;
                            switch (this.options.shieldDisableConfig.mode) {
                                case "single":
                                case "double":
                                    this.tickOverride = true;
                                    yield this.bot.waitForTicks(3);
                                    yield this.attemptAttack();
                                    if (this.options.shieldDisableConfig.mode === "single")
                                        break;
                                    yield this.bot.waitForTicks(3);
                                    yield this.attemptAttack();
                            }
                            this.tickOverride = false;
                        }
                    }
                }
            }
            else {
                if (this.targetShielding)
                    this.ticksSinceLastSwitch = 0;
                this.targetShielding = false;
                if (this.weaponOfChoice === "sword" || this.tickOverride)
                    return; //assume already attacking
                const itemToChangeTo = yield this.checkForWeapon("sword");
                if (itemToChangeTo) {
                    const switched = yield this.equipWeapon(itemToChangeTo);
                    if (switched) {
                        this.weaponOfChoice = "sword";
                        this.timeToNextAttack = this.meleeAttackRate.getTicks(this.bot.heldItem);
                    }
                }
            }
        });
        this.swingUpdate = (entity) => __awaiter(this, void 0, void 0, function* () {
            if (entity === this.target) {
                this.ticksSinceTargetAttack = 0;
                if (this.ticksSinceLastHurt < 2)
                    this.ticksSinceLastTargetHit = 0;
            }
        });
        this.hurtUpdate = (entity) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            if (!this.target)
                return;
            if (entity === this.bot.entity) {
                this.ticksSinceLastHurt = 0;
                if (this.options.kbCancelConfig.enabled) {
                    switch (this.options.kbCancelConfig.mode.name) {
                        case "velocity":
                            yield new Promise((resolve, reject) => {
                                const listener = (packet) => {
                                    const entity = this.bot.entities[packet.entityId];
                                    if (entity === this.bot.entity) {
                                        if (this.options.kbCancelConfig.mode.hRatio || this.options.kbCancelConfig.mode.hRatio === 0) {
                                            this.bot.entity.velocity.x *= this.options.kbCancelConfig.mode.hRatio;
                                            this.bot.entity.velocity.z *= this.options.kbCancelConfig.mode.hRatio;
                                        }
                                        if (this.options.kbCancelConfig.mode.yRatio || this.options.kbCancelConfig.mode.yRatio === 0)
                                            this.bot.entity.velocity.y *= this.options.kbCancelConfig.mode.yRatio;
                                        this.bot._client.removeListener("entity_velocity", listener);
                                        resolve(undefined);
                                    }
                                };
                                setTimeout(() => {
                                    this.bot._client.removeListener("entity_velocity", listener);
                                    resolve(undefined);
                                }, 500);
                                this.bot._client.on("entity_velocity", listener);
                            });
                            return;
                        case "jump":
                        case "jumpshift":
                            if ((0, mathUtilts_1.lookingAt)(entity, this.bot.entity, this.options.genericConfig.enemyReach)) {
                                this.bot.setControlState("right", false);
                                this.bot.setControlState("left", false);
                                this.bot.setControlState("back", false);
                                this.bot.setControlState("sneak", false);
                                this.bot.setControlState("forward", true);
                                this.bot.setControlState("sprint", true);
                                this.bot.setControlState("jump", true);
                                this.bot.setControlState("jump", false);
                            }
                            if (this.options.kbCancelConfig.mode.name === "jump")
                                break;
                        case "shift":
                            if ((0, mathUtilts_1.lookingAt)(entity, this.target, this.options.genericConfig.enemyReach)) {
                                this.bot.setControlState("sneak", true);
                                yield this.bot.waitForTicks((_b = this.options.kbCancelConfig.mode.delay) !== null && _b !== void 0 ? _b : 5);
                                this.bot.setControlState("sneak", false);
                                this.bot.setControlState("sprint", true);
                            }
                            break;
                    }
                }
                if (this.options.swingConfig.mode === "fullswing" && this.options.critConfig.enabled)
                    this.reactionaryCrit();
            }
        });
        // per tick.
        this.update = () => {
            if (!this.target)
                return;
            this.timeToNextAttack--;
            this.ticksSinceTargetAttack++;
            this.ticksSinceLastHurt++;
            this.ticksSinceLastTargetHit++;
            this.ticksSinceLastSwitch++;
            this.checkRange();
            this.rotate();
            this.doMove();
            this.doStrafe();
            this.causeCritical();
            this.toggleShield();
            if (this.timeToNextAttack === -1 && !this.tickOverride) {
                // const health = this.bot.util.entity.getHealth(this.target);
                this.attemptAttack();
                this.sprintTap();
                // this.logHealth(health);
            }
        };
        this.meleeAttackRate = new sworddata_1.MaxDamageOffset(this.bot);
        this.bot.on("physicsTick", this.update);
        this.bot.on("physicsTick", this.checkForShield);
        this.bot.on("entityGone", (e) => {
            if (e === this.target) {
                // this.bot.chat(
                //     `Fought ${this.target.username ?? this.target.name}. I finished with ${this.bot.health.toFixed(2)} HP, they finished with ${this.target.health?.toFixed(2)} HP.`
                // );
                this.stop();
            }
        });
        this.bot.on("entitySwingArm", this.swingUpdate);
        this.bot.on("entityHurt", this.hurtUpdate);
    }
    changeWeaponState(weapon) {
        const hasWeapon = this.checkForWeapon(weapon);
        if (hasWeapon) {
            this.weaponOfChoice = weapon;
            return hasWeapon;
        }
        return null;
    }
    checkForWeapon(weapon) {
        if (!weapon)
            weapon = this.weaponOfChoice;
        const heldItem = this.bot.inventory.slots[this.bot.getEquipmentDestSlot("hand")];
        if (heldItem === null || heldItem === void 0 ? void 0 : heldItem.name.includes(weapon)) {
            return heldItem;
        }
        else {
            const item = this.bot.util.inv.getAllItems().find((item) => item === null || item === void 0 ? void 0 : item.name.includes(weapon));
            return item ? item : null;
        }
    }
    equipWeapon(weapon) {
        return __awaiter(this, void 0, void 0, function* () {
            const heldItem = this.bot.inventory.slots[this.bot.getEquipmentDestSlot("hand")];
            return (heldItem === null || heldItem === void 0 ? void 0 : heldItem.name) === weapon.name ? false : yield this.bot.util.inv.customEquip(weapon, "hand");
        });
    }
    getWeaponOfEntity(entity) {
        var _a;
        return (_a = (entity !== null && entity !== void 0 ? entity : this.bot.entity)) === null || _a === void 0 ? void 0 : _a.heldItem;
    }
    getShieldStatusOfEntity(entity) {
        entity = entity !== null && entity !== void 0 ? entity : this.bot.entity;
        const shieldSlot = entity.equipment[1];
        return (shieldSlot === null || shieldSlot === void 0 ? void 0 : shieldSlot.name) === "shield" && this.bot.util.entity.isOffHandActive(entity);
    }
    attack(target) {
        return __awaiter(this, void 0, void 0, function* () {
            if (target === this.target)
                return;
            this.stop();
            this.target = target;
            if (!this.target)
                return;
            this.timeToNextAttack = 0;
            const itemToChangeTo = yield this.checkForWeapon();
            if (itemToChangeTo)
                yield this.equipWeapon(itemToChangeTo);
            this.bot.tracker.trackEntity(target);
            this.bot.tracker.trackEntity(this.bot.entity);
            this.emit("startedAttacking", this.target);
        });
    }
    stop() {
        if (!this.target)
            return;
        this.lastTarget = this.target;
        this.bot.tracker.stopTrackingEntity(this.target);
        this.target = undefined;
        (0, swordutil_1.stopFollow)(this.bot, this.options.followConfig.mode);
        this.bot.clearControlStates();
        this.emit("stoppedAttacking");
    }
    botReach() {
        if (!this.target)
            return 10000;
        return getEntityAABB(this.target).distanceToVec(this.bot.entity.position.offset(0, 1.62, 0));
    }
    targetReach() {
        if (!this.target)
            return 10000;
        return getEntityAABB(this.bot.entity).distanceToVec(this.target.position.offset(0, this.target.height == 1.8 ? 1.62 : this.target.height, 0));
    }
    checkRange() {
        if (!this.target)
            return;
        // if (this.timeToNextAttack < 0) return;
        const dist = this.target.position.distanceTo(this.bot.entity.position);
        if (dist > this.options.genericConfig.viewDistance)
            return this.stop();
        const inRange = this.botReach() <= this.options.genericConfig.attackRange;
        if (!this.wasInRange && inRange && this.options.swingConfig.mode === "killaura")
            this.timeToNextAttack = 0;
        this.wasInRange = inRange;
    }
    logHealth(health) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target)
                return;
            const newHealth = yield new Promise((resolve, reject) => {
                const listener = (packet) => {
                    const entityId = packet.entityId;
                    const entity = this.bot.entities[entityId];
                    if (entity !== this.target)
                        return;
                    if (packet.metadata.find((md) => md.key === 7) === -1)
                        return;
                    resolve(this.bot.util.entity.getHealthChange(packet.metadata, entity));
                };
                this.bot._client.removeListener("entity_metadata", listener);
                setTimeout(() => {
                    this.bot._client.removeListener("entity_metadata", listener);
                    resolve(0);
                }, 500);
                this.bot._client.prependListener("entity_metadata", listener);
            });
            health = Math.round((health + newHealth) * 100) / 100;
            if (!isNaN(health))
                console.log(`Dealt ${newHealth} damage. Target ${(_a = this.target) === null || _a === void 0 ? void 0 : _a.username} has ${health} health left.`);
        });
    }
    causeCritical() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.critConfig.enabled || !this.target)
                return false;
            switch (this.options.critConfig.mode) {
                case "packet":
                    if (this.timeToNextAttack !== -1)
                        return false;
                    if (!this.wasInRange)
                        return false;
                    // this.bot._client.write("position", { ...this.bot.entity.position, onGround: true });
                    this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 0.1625, 0)), { onGround: false }));
                    this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 4.0e-6, 0)), { onGround: false }));
                    this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 1.1e-6, 0)), { onGround: false }));
                    this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position), { onGround: false }));
                    this.bot.entity.onGround = false;
                    return true;
                case "shorthop":
                    if (this.timeToNextAttack !== 1)
                        return false;
                    if (!this.bot.entity.onGround)
                        return false;
                    if (this.botReach() > this.options.genericConfig.attackRange)
                        return false;
                    this.bot.entity.position = this.bot.entity.position.offset(0, 0.25, 0);
                    this.bot.entity.onGround = false;
                    yield this.bot.waitForTicks(2);
                    const { x: dx, y: dy, z: dz } = this.bot.entity.position;
                    this.bot.entity.position = this.bot.entity.position.set(dx, Math.floor(dy), dz);
                    return true;
                case "hop":
                    if (this.timeToNextAttack > 7)
                        return false;
                    if (this.timeToNextAttack === 7 || this.firstHit) {
                        if (!this.bot.entity.onGround) {
                            this.reactionaryCrit();
                            return false;
                        }
                        if (this.botReach() > this.options.genericConfig.attackRange - 1)
                            return false;
                        this.bot.setControlState("jump", true);
                        this.bot.setControlState("jump", false);
                        this.reactionaryCrit();
                        // if (this.options.swingConfig.mode === "fullswing") this.timeToNextAttack = 7;
                        if (!this.wasInRange) {
                            this.bot.setControlState("forward", true);
                        }
                    }
                    else {
                        if (!this.wasInRange) {
                            this.bot.setControlState("forward", true);
                        }
                    }
                    return true;
                default:
                    return false;
            }
        });
    }
    forwardOrBack(conditional) {
        return conditional ? "forward" : "back";
    }
    doMove() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target) {
                this.bot.clearControlStates();
                return;
            }
            const farAway = this.botReach() >= this.options.genericConfig.attackRange + 2;
            if (farAway && !this.targetGoal) {
                this.targetGoal = (0, swordutil_1.followEntity)(this.bot, this.target, this.options, 8);
            }
            else if (!farAway) {
                if (this.targetGoal) {
                    (0, swordutil_1.stopFollow)(this.bot, this.options.followConfig.mode);
                    this.targetGoal = undefined;
                }
                const conditional = this.botReach() > 0; //this.options.genericConfig.attackRange / 20;
                if (!this.bot.getControlState("back")) {
                    this.bot.setControlState("forward", conditional);
                    this.bot.setControlState("sprint", conditional);
                }
            }
            // console.log(`${(this.bot.pathfinder.goal as any)?.x} ${(this.bot.pathfinder.goal as any)?.y} ${(this.bot.pathfinder.goal as any)?.z}`)
        });
    }
    doStrafe() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target) {
                if (this.currentStrafeDir) {
                    this.bot.setControlState(this.currentStrafeDir, false);
                    this.currentStrafeDir = undefined;
                }
                return false;
            }
            if (!this.options.strafeConfig.enabled)
                return false;
            const diff = (0, mathUtilts_1.getTargetYaw)(this.target.position, this.bot.entity.position) - this.target.yaw;
            const shouldMove = Math.abs(diff) < ((_a = this.options.strafeConfig.mode.maxOffset) !== null && _a !== void 0 ? _a : PI_OVER_3);
            if (!shouldMove) {
                if (this.currentStrafeDir)
                    this.bot.setControlState(this.currentStrafeDir, false);
                this.currentStrafeDir = undefined;
                return;
            }
            switch (this.options.strafeConfig.mode.name) {
                case "circle":
                    const circleDir = diff < 0 ? "right" : "left";
                    if (circleDir !== this.currentStrafeDir) {
                        if (this.currentStrafeDir)
                            this.bot.setControlState(this.currentStrafeDir, false);
                    }
                    this.currentStrafeDir = circleDir;
                    this.bot.setControlState(circleDir, true);
                    break;
                case "random":
                    if (this.strafeCounter < 0) {
                        this.strafeCounter = Math.floor(Math.random() * 20) + 5;
                        const rand = Math.random();
                        const randomDir = rand < 0.5 ? "left" : "right";
                        const oppositeDir = rand >= 0.5 ? "left" : "right";
                        if (this.botReach() <= this.options.genericConfig.attackRange + 3) {
                            this.bot.setControlState(randomDir, true);
                            this.bot.setControlState(oppositeDir, false);
                            this.currentStrafeDir = randomDir;
                        }
                    }
                    this.strafeCounter--;
                    break;
                case "intelligent":
                    if (this.ticksSinceLastTargetHit > 40) {
                        this.bot.setControlState("left", false);
                        this.bot.setControlState("right", false);
                        this.currentStrafeDir = undefined;
                    }
                    else if (this.strafeCounter < 0) {
                        this.strafeCounter = Math.floor(Math.random() * 20) + 5;
                        const intelliRand = Math.random();
                        const smartDir = intelliRand < 0.5 ? "left" : "right";
                        const oppositeSmartDir = intelliRand >= 0.5 ? "left" : "right";
                        if (this.botReach() <= this.options.genericConfig.attackRange + 3) {
                            this.bot.setControlState(smartDir, true);
                            this.bot.setControlState(oppositeSmartDir, false);
                            this.currentStrafeDir = smartDir;
                        }
                        else {
                            if (this.currentStrafeDir)
                                this.bot.setControlState(this.currentStrafeDir, false);
                            this.currentStrafeDir = undefined;
                        }
                    }
                    this.strafeCounter--;
            }
        });
    }
    sprintTap() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target)
                return false;
            if (!this.bot.entity.onGround)
                return false;
            if (!this.wasInRange)
                return false;
            if (!this.options.tapConfig.enabled)
                return false;
            switch (this.options.tapConfig.mode) {
                case "wtap":
                    this.bot.setControlState("forward", false);
                    this.bot.setControlState("sprint", false);
                    yield this.bot.waitForTicks(this.options.tapConfig.delay);
                    this.bot.setControlState("forward", true);
                    this.bot.setControlState("sprint", true);
                    break;
                case "stap":
                    do {
                        this.bot.setControlState("forward", false);
                        this.bot.setControlState("sprint", false);
                        this.bot.setControlState("back", true);
                        const looking = (0, mathUtilts_1.movingAt)(this.target.position, this.bot.entity.position, 
                        // this.options.genericConfig.enemyReach
                        (_a = this.bot.tracker.getEntitySpeed(this.target)) !== null && _a !== void 0 ? _a : DEFAULT_SPEED, PI_OVER_3);
                        if (!looking && this.wasInRange)
                            break;
                        yield this.bot.waitForTicks(1);
                    } while (this.botReach() < this.options.genericConfig.attackRange + 0.1);
                    this.bot.setControlState("back", false);
                    this.bot.setControlState("forward", true);
                    this.bot.setControlState("sprint", true);
                    break;
                default:
                    break;
            }
        });
    }
    toggleShield() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.timeToNextAttack !== 0 || !this.target || !this.wasInRange)
                return false;
            const shield = this.hasShield();
            const wasShieldActive = shield;
            if (wasShieldActive && this.options.shieldConfig.enabled && this.options.shieldConfig.mode === "legit") {
                this.bot.deactivateItem();
            }
            this.once("attackedTarget", (entity) => __awaiter(this, void 0, void 0, function* () {
                yield this.bot.waitForTicks(3);
                if (wasShieldActive && this.options.shieldConfig.enabled && this.options.shieldConfig.mode === "legit") {
                    this.bot.activateItem(true);
                }
                else if (!this.bot.util.entity.isOffHandActive() && shield && this.options.shieldConfig.mode === "blatant") {
                    this.bot.activateItem(true);
                }
            }));
            // await once(this.bot, "attackedTarget");
        });
    }
    rotate() {
        if (!this.options.rotateConfig.enabled || !this.target)
            return false;
        const pos = this.target.position.offset(0, this.target.height, 0);
        if (this.options.rotateConfig.mode === "constant") {
            this.bot.lookAt(pos);
            // this.bot.util.move.forceLookAt(pos, true);
            return;
        }
        else {
            if (this.timeToNextAttack !== -1)
                return;
            switch (this.options.rotateConfig.mode) {
                case "legit":
                    this.bot.lookAt(pos);
                    break;
                case "instant":
                    this.bot.lookAt(pos, true);
                    break;
                case "silent":
                    this.bot.util.move.forceLookAt(pos, true);
                    break;
                case "ignore":
                    break;
                default:
                    break;
            }
        }
    }
    reactionaryCrit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target)
                return;
            if (this.tickOverride)
                return;
            this.tickOverride = true;
            let i = 0;
            for (; i < 12; i++) {
                if (this.bot.entity.velocity.y <= -0.3)
                    break;
                yield this.bot.waitForTicks(1);
            }
            this.bot.setControlState("sprint", false);
            if (this.timeToNextAttack < 2)
                yield this.attemptAttack();
            // for (let i = 0; i < 10; i++) {
            //     if (this.bot.entity.onGround) break;
            //     await this.bot.waitForTicks(1);
            // }
            this.tickOverride = false;
        });
    }
    attemptAttack() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target)
                return;
            if (!this.wasInRange) {
                this.timeToNextAttack = 0;
                this.firstHit = true;
                return;
            }
            if (Math.random() < this.options.genericConfig.missChancePerTick) {
                // this.timeToNextAttack = 0;
                yield this.bot.waitForTicks(1);
                yield this.attemptAttack();
                return;
            }
            // if (this.timeToNextAttack <-1) console.trace(this.timeToNextAttack);
            (0, util_2.attack)(this.bot, this.target);
            this.firstHit = false;
            this.emit("attackedTarget", this.target);
            this.timeToNextAttack = this.meleeAttackRate.getTicks(this.bot.heldItem);
        });
    }
    hasShield() {
        if (this.bot.supportFeature("doesntHaveOffHandSlot"))
            return false;
        const slot = this.bot.inventory.slots[this.bot.getEquipmentDestSlot("off-hand")];
        if (!slot)
            return false;
        return slot.name.includes("shield");
    }
}
exports.SwordPvp = SwordPvp;
