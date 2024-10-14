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
const mineflayer_util_plugin_1 = require("@nxg-org/mineflayer-util-plugin");
const stream_1 = require("stream");
const vec3_1 = require("vec3");
const mathUtils_1 = require("../calc/mathUtils");
const util_1 = require("../util");
const swordconfigs_1 = require("./swordconfigs");
const sworddata_1 = require("./sworddata");
const swordutil_1 = require("./swordutil");
const { getEntityAABB } = mineflayer_util_plugin_1.AABBUtils;
const PIOver3 = Math.PI / 3;
/**
 * The main pvp manager plugin class.
 */
class SwordPvp extends stream_1.EventEmitter {
    constructor(bot, options = swordconfigs_1.defaultConfig) {
        super();
        this.bot = bot;
        this.options = options;
        this.ticksToNextAttack = 0;
        this.ticksSinceTargetAttack = 0;
        this.ticksSinceLastHurt = 0;
        this.ticksSinceLastTargetHit = 0;
        this.ticksSinceLastSwitch = 0;
        this.wasInRange = false;
        this.weaponOfChoice = "sword";
        this.willBeFirstHit = true;
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
                if (this.ticksSinceTargetAttack >= 3 && this.ticksSinceLastSwitch >= 3 && !this.tickOverride) {
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
                                    yield this.attemptAttack("disableshield");
                                    if (this.options.shieldDisableConfig.mode === "single")
                                        break;
                                    yield this.bot.waitForTicks(3);
                                    yield this.attemptAttack("doubledisableshield");
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
                        this.ticksToNextAttack = this.meleeAttackRate.getTicks(this.bot.heldItem);
                    }
                }
            }
        });
        this.swingUpdate = (entity) => __awaiter(this, void 0, void 0, function* () {
            if (entity === this.target) {
                this.ticksSinceTargetAttack = 0;
            }
        });
        this.lastHealth = 20;
        this.hurtUpdate = (entity) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            if (!this.target)
                return;
            if (entity === this.bot.entity) {
                if ((_b = this.lastHealth <= this.bot.health) !== null && _b !== void 0 ? _b : 20) {
                    this.lastHealth = this.bot.health;
                    return;
                }
                this.lastHealth = this.bot.health;
                this.ticksSinceLastHurt = 0;
                if (this.ticksSinceTargetAttack < 6)
                    this.ticksSinceLastTargetHit = 0;
                // console.log('hey', entity === this.target, entity.name, this.target?.name, this.ticksSinceLastHurt, this.ticksSinceLastTargetHit, this.ticksSinceTargetAttack)
                if (this.options.onHitConfig.kbCancel.enabled) {
                    switch (this.options.onHitConfig.kbCancel.mode) {
                        case "velocity":
                            yield new Promise((resolve, reject) => {
                                const listener = (packet) => {
                                    const entity = this.bot.entities[packet.entityId];
                                    if (entity === this.bot.entity) {
                                        if (this.options.onHitConfig.kbCancel.mode !== "velocity")
                                            return;
                                        if (this.options.onHitConfig.kbCancel.hRatio || this.options.onHitConfig.kbCancel.hRatio === 0) {
                                            this.bot.entity.velocity.x *= this.options.onHitConfig.kbCancel.hRatio;
                                            this.bot.entity.velocity.z *= this.options.onHitConfig.kbCancel.hRatio;
                                        }
                                        if (this.options.onHitConfig.kbCancel.yRatio || this.options.onHitConfig.kbCancel.yRatio === 0)
                                            this.bot.entity.velocity.y *= this.options.onHitConfig.kbCancel.yRatio;
                                        this.bot._client.removeListener("entity_velocity", listener);
                                        resolve();
                                    }
                                };
                                setTimeout(() => {
                                    this.bot._client.removeListener("entity_velocity", listener);
                                    resolve();
                                }, 500);
                                this.bot._client.on("entity_velocity", listener);
                            });
                            return;
                        case "jump":
                        case "jumpshift":
                            if ((0, mathUtils_1.lookingAt)(entity, this.bot.entity, this.options.genericConfig.enemyReach)) {
                                this.bot.setControlState("right", false);
                                this.bot.setControlState("left", false);
                                this.bot.setControlState("back", false);
                                this.bot.setControlState("sneak", false);
                                this.bot.setControlState("forward", true);
                                this.bot.setControlState("sprint", true);
                                this.bot.setControlState("jump", true);
                                this.bot.setControlState("jump", false);
                            }
                            if (this.options.onHitConfig.kbCancel.mode === "jump")
                                break;
                        case "shift":
                            if ((0, mathUtils_1.lookingAt)(entity, this.target, this.options.genericConfig.enemyReach)) {
                                this.bot.setControlState("sneak", true);
                                yield this.bot.waitForTicks(this.options.onHitConfig.kbCancel.delay || 5);
                                this.bot.setControlState("sneak", false);
                                this.bot.setControlState("sprint", true);
                            }
                            break;
                    }
                }
                const before = performance.now();
                // console.log("before:", this.bot.entity.velocity)
                yield new Promise((res, rej) => {
                    const listener = (packet) => {
                        const entity = this.bot.entities[packet.entityId];
                        if (entity !== this.bot.entity)
                            return;
                        const notchVel = new vec3_1.Vec3(packet.velocityX, packet.velocityY, packet.velocityZ);
                        this.bot._client.removeListener("entity_velocity", listener);
                        res(undefined);
                    };
                    this.bot._client.on("entity_velocity", listener);
                });
                // console.log("after:", this.bot.entity.velocity,  performance.now() - before)
                if (this.options.swingConfig.mode === "fullswing")
                    this.reactionaryCrit();
            }
        });
        // per tick.
        this.update = () => {
            if (!this.target)
                return;
            this.ticksToNextAttack--;
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
            if (this.ticksToNextAttack <= -1 && !this.tickOverride) {
                if (this.bot.entity.velocity.y <= -0.25)
                    this.bot.setControlState("sprint", false);
                this.attemptAttack("normal");
                if (this.bot.entity.onGround)
                    this.sprintTap();
            }
        };
        this.meleeAttackRate = new sworddata_1.MaxDamageOffset(this.bot);
        const oldEmit = this.bot.emit.bind(this.bot);
        const oldEmit1 = this.bot._client.emit.bind(this.bot._client);
        // this.bot.emit = ((event: any, ...args: any[]) => {
        //   if (event.startsWith("entity")) console.log(event, args)
        //   return oldEmit(event, ...args)
        // })
        // this.bot._client.emit = ((event: any, ...args: any[]) => {
        //   if (!event.includes("chunk")) console.log(event, args)
        //   return oldEmit1(event, ...args)
        // })
        this.bot.on("physicsTick", this.update);
        this.bot.on("physicsTick", this.checkForShield);
        this.bot.on("entitySwingArm", this.swingUpdate);
        this.bot.on('entityUpdate', this.hurtUpdate);
        // this.bot.on("entityHurt", this.hurtUpdate);
        // this.bot.on('health', this.hurtUpdate.bind(this, this.bot.entity))
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
            return (heldItem === null || heldItem === void 0 ? void 0 : heldItem.name) === weapon.name ? true : yield this.bot.util.inv.customEquip(weapon, "hand");
        });
    }
    entityWeapon(entity) {
        var _a;
        return (_a = (entity !== null && entity !== void 0 ? entity : this.bot.entity)) === null || _a === void 0 ? void 0 : _a.heldItem;
    }
    entityShieldStatus(entity) {
        entity = entity !== null && entity !== void 0 ? entity : this.bot.entity;
        const shieldSlot = entity.equipment[1];
        return (shieldSlot === null || shieldSlot === void 0 ? void 0 : shieldSlot.name) === "shield" && this.bot.util.entity.isOffHandActive(entity);
    }
    attack(target) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if ((target === null || target === void 0 ? void 0 : target.id) === ((_a = this.target) === null || _a === void 0 ? void 0 : _a.id))
                return;
            this.stop();
            this.target = target;
            if (!this.target)
                return;
            this.ticksToNextAttack = 0;
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
        const eye = getEntityAABB(this.target).distanceToVec(this.bot.entity.position.offset(0, this.bot.entity.height, 0));
        const foot = getEntityAABB(this.target).distanceToVec(this.bot.entity.position);
        return Math.min(eye, foot);
    }
    targetReach() {
        if (!this.target)
            return 10000;
        const eye = getEntityAABB(this.bot.entity).distanceToVec(this.target.position.offset(0, this.target.height, 0));
        const foot = getEntityAABB(this.bot.entity).distanceToVec(this.target.position);
        return Math.min(eye, foot);
    }
    checkRange() {
        if (!this.target)
            return;
        const dist = this.target.position.distanceTo(this.bot.entity.position);
        if (dist > this.options.genericConfig.viewDistance)
            return this.stop();
        const inRange = this.botReach() <= this.options.genericConfig.attackRange;
        if (!this.wasInRange && inRange && this.options.swingConfig.mode === "killaura")
            this.ticksToNextAttack = -1;
        this.wasInRange = inRange;
    }
    causeCritical() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.critConfig.enabled || !this.target)
                return false;
            if (this.bot.entity.isInWater || this.bot.entity.isInLava)
                return false;
            switch (this.options.critConfig.mode) {
                case "packet":
                    if (this.ticksToNextAttack !== -1)
                        return false;
                    if (!this.wasInRange)
                        return false;
                    if (!this.bot.entity.onGround)
                        return false;
                    if (this.options.critConfig.bypass) {
                        this.bot.setControlState("sprint", false);
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 0.11, 0)), { onGround: false }));
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 0.1100013579, 0)), { onGround: false }));
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 0.0000013579, 0)), { onGround: false }));
                    }
                    else {
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 0.1625, 0)), { onGround: false }));
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 4.0e-6, 0)), { onGround: false }));
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position.offset(0, 1.1e-6, 0)), { onGround: false }));
                        this.bot._client.write("position", Object.assign(Object.assign({}, this.bot.entity.position), { onGround: false }));
                    }
                    return true;
                case "shorthop":
                    if (this.ticksToNextAttack !== 1)
                        return false;
                    if (!this.bot.entity.onGround)
                        return false;
                    if (this.botReach() <= (this.options.critConfig.attemptRange || this.options.genericConfig.attackRange))
                        return false;
                    this.bot.entity.position = this.bot.entity.position.offset(0, 0.25, 0);
                    this.bot.entity.onGround = false;
                    yield this.bot.waitForTicks(2);
                    const { x: dx, y: dy, z: dz } = this.bot.entity.position;
                    this.bot.entity.position = this.bot.entity.position.set(dx, Math.floor(dy), dz);
                    return true;
                case "hop":
                    if (this.ticksToNextAttack > 8)
                        return false;
                    const inReach = this.botReach() <= (this.options.critConfig.attemptRange || this.options.genericConfig.attackRange);
                    if (!inReach)
                        return false;
                    if (this.ticksToNextAttack !== 8 && !this.willBeFirstHit) {
                        return false;
                    }
                    if (this.willBeFirstHit && !this.bot.entity.onGround) {
                        this.reactionaryCrit(true);
                        return true;
                    }
                    this.bot.setControlState("jump", true);
                    this.bot.setControlState("jump", false);
                    return true;
                default:
                    return false;
            }
        });
    }
    doMove() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target) {
                this.bot.clearControlStates();
                return;
            }
            const farAway = this.botReach() >= this.options.genericConfig.attackRange;
            if (farAway) {
                this.targetGoal = (0, swordutil_1.followEntity)(this.bot, this.target, this.options);
            }
            else {
                if (this.targetGoal) {
                    (0, swordutil_1.stopFollow)(this.bot, this.options.followConfig.mode);
                    this.targetGoal = undefined;
                }
                let shouldApproach = true;
                if (this.options.onHitConfig.enabled) {
                    const distCheck = this.targetReach() <= this.options.genericConfig.enemyReach + 1;
                    switch (this.options.onHitConfig.mode) {
                        case "backoff":
                            shouldApproach = this.ticksSinceLastHurt > ((_a = this.options.onHitConfig.tickCount) !== null && _a !== void 0 ? _a : 5) && distCheck;
                            break;
                    }
                }
                const tooClose = this.botReach() > this.options.genericConfig.tooCloseRange;
                shouldApproach = shouldApproach && tooClose;
                if (!this.bot.getControlState("back")) {
                    this.bot.setControlState("forward", shouldApproach);
                    this.bot.setControlState("sprint", shouldApproach);
                }
            }
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
            const diff = (0, mathUtils_1.getTargetYaw)(this.target.position, this.bot.entity.position) - this.target.yaw;
            const shouldMove = Math.abs(diff) < ((_a = this.options.strafeConfig.mode.maxOffset) !== null && _a !== void 0 ? _a : PIOver3);
            // console.log('shouldMove', shouldMove)
            if (!shouldMove) {
                if (this.currentStrafeDir)
                    this.bot.setControlState(this.currentStrafeDir, false);
                this.currentStrafeDir = undefined;
                return;
            }
            switch (this.options.strafeConfig.mode.mode) {
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
                    // console.log(this.ticksSinceLastTargetHit, this.currentStrafeDir, this.strafeCounter)
                    if (this.ticksSinceLastTargetHit > 40) {
                        this.bot.setControlState("left", false);
                        this.bot.setControlState("right", false);
                        this.currentStrafeDir = undefined;
                    }
                    else {
                        if (this.strafeCounter < 0 || this.currentStrafeDir === undefined) {
                            this.strafeCounter = Math.floor(Math.random() * 20) + 5;
                            const intelliRand = Math.random();
                            const smartDir = intelliRand < 0.5 ? "left" : "right";
                            const oppositeSmartDir = intelliRand >= 0.5 ? "left" : "right";
                            this.currentStrafeDir = smartDir;
                        }
                        const oppositeSmartDir = this.currentStrafeDir === 'left' ? "right" : "left";
                        if (this.botReach() <= this.options.genericConfig.attackRange + 3) {
                            this.bot.setControlState(this.currentStrafeDir, true);
                            this.bot.setControlState(oppositeSmartDir, false);
                            // console.log('set',this.currentStrafeDir, 'true', oppositeSmartDir, 'false')
                            // console.log(this.bot.getControlState('left'), this.bot.getControlState('right'), this.botReach(), this.options.genericConfig.attackRange + 3)
                        }
                        else {
                            if (this.currentStrafeDir)
                                this.bot.setControlState(this.currentStrafeDir, false);
                            this.currentStrafeDir = undefined;
                        }
                    }
                    // console.log(this.bot.getControlState('left'), this.bot.getControlState('right'), this.botReach(), this.options.genericConfig.attackRange + 3)
                    this.strafeCounter--;
            }
        });
    }
    sprintTap() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.target)
                return;
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
                    this.bot.setControlState("forward", true);
                    this.bot.setControlState("sprint", true);
                    break;
                case "stap":
                    // if (this.bot.getControlState("back")) {
                    // this.bot.setControlState("forward", true);
                    // this.bot.setControlState("sprint", true);
                    // this.bot.setControlState("back", false);
                    // }
                    do {
                        this.bot.setControlState("forward", false);
                        this.bot.setControlState("sprint", false);
                        this.bot.setControlState("back", true);
                        const looking = (0, mathUtils_1.movingAt)(this.target.position, this.bot.entity.position, 
                        // this.options.genericConfig.enemyReach
                        (_a = this.bot.tracker.getEntitySpeed(this.target)) !== null && _a !== void 0 ? _a : new vec3_1.Vec3(0, 0, 0), PIOver3);
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
            if (this.ticksToNextAttack !== 0 || !this.target || !this.wasInRange)
                return false;
            const shield = this.shieldEquipped();
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
            return;
        }
        else {
            if (this.ticksToNextAttack !== -1)
                return;
            switch (this.options.rotateConfig.mode) {
                case "legit":
                    this.bot.lookAt(pos);
                    break;
                case "instant":
                    this.bot.lookAt(pos, true);
                    break;
                case "silent":
                    this.bot.util.move.forceLookAt(pos);
                    break;
                case "ignore":
                    break;
                default:
                    break;
            }
        }
    }
    reactionaryCrit(noTickLimit = false) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.critConfig.reaction.enabled)
                return;
            if (!this.target)
                return;
            if (this.tickOverride)
                return;
            this.tickOverride = true;
            let i = 0;
            for (; i < 12; i++) {
                yield this.bot.waitForTicks(1);
                if (this.bot.entity.onGround) {
                    this.tickOverride = false;
                    return;
                }
                if (this.options.critConfig.reaction.maxWaitDistance) {
                    if (this.botReach() >= this.options.critConfig.reaction.maxWaitDistance) {
                        this.tickOverride = false;
                        return;
                    }
                }
                if (this.bot.entity.velocity.y <= -0.25 && this.ticksToNextAttack <= (-1 + ((_a = this.options.critConfig.reaction.maxPreemptiveTicks) !== null && _a !== void 0 ? _a : 0))) {
                    break;
                }
                if (this.options.critConfig.reaction.maxWaitTicks && !noTickLimit) {
                    if (this.ticksToNextAttack <= (-1 - this.options.critConfig.reaction.maxWaitTicks)) {
                        break;
                    }
                }
            }
            this.bot.setControlState("sprint", false);
            yield this.attemptAttack("reaction");
            this.tickOverride = false;
        });
    }
    attemptAttack(reason) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("called attack:", reason, this.wasInRange, this.bot.getControlState("sprint"), this.bot.entity.velocity.y);
            if (!this.target)
                return;
            if (!this.wasInRange) {
                this.willBeFirstHit = true;
                return;
            }
            if (Math.random() < this.options.genericConfig.missChancePerTick) {
                // this.timeToNextAttack = 0;
                yield this.bot.waitForTicks(1);
                yield this.attemptAttack(reason);
                return;
            }
            (0, util_1.attack)(this.bot, this.target);
            this.willBeFirstHit = false;
            this.emit("attackedTarget", this.target, reason, this.ticksToNextAttack);
            this.ticksToNextAttack = this.meleeAttackRate.getTicks(this.bot.heldItem);
        });
    }
    shieldEquipped() {
        if (this.bot.supportFeature("doesntHaveOffHandSlot"))
            return false;
        const slot = this.bot.inventory.slots[this.bot.getEquipmentDestSlot("off-hand")];
        if (!slot)
            return false;
        return slot.name.includes("shield");
    }
}
exports.SwordPvp = SwordPvp;
