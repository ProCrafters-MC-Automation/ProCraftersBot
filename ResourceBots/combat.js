let UltimateBot

function load(UltimateBotClass) {
    UltimateBot = UltimateBotClass

    UltimateBot.addTarget = addTarget
    UltimateBot.clearTargets = clearTargets
    UltimateBot.equipForCombat = equipForCombat
    UltimateBot.hasShield = hasShield
    UltimateBot.checkForTargets = checkForTargets
}


// Combat
var targets = [] // the bot will attack any entites
// that relate to target strings, looking up their
// usernames, types and entity names
var attackTick = 0 // Timing
var eatTick = 0    // anti-annoying-spam-food-noise

function addTarget(filter) {
    targets.push(filter)
}

function clearTargets() {
    targets = []
    UltimateBot.setControlState('forward', false)
    UltimateBot.setControlState('sprint', false)
    UltimateBot.setControlState('jump', false)
}

function equipForCombat(priorizeAxe = false) {
    if (priorizeAxe) {
        const weapon = UltimateBot.inventory.items().find(item => item.name.includes('_axe'))
        if (weapon) {
            UltimateBot.equip(weapon, 'hand')
            return
        }
    }
    const weapon = UltimateBot.inventory.items().find(item => item.name.includes('sword'))
    if (weapon) {
        UltimateBot.equip(weapon, 'hand')
    }
    UltimateBot.armorManager.equipAll()
}

/// Weapon management (from mineflayer-pvp)
function hasShield() {
    if (UltimateBot.supportFeature('doesntHaveOffHandSlot'))
        return false;
    const slot = UltimateBot.inventory.slots[UltimateBot.getEquipmentDestSlot('off-hand')];
    if (!slot)
        return false;
    return slot.name.includes('shield');
}

const { check } = require("uuid-1345")
const attackSpeeds = require("./AttackSpeeds.json")

function getAttackSpeed(weaponName) {
    if (!weaponName)
        return attackSpeeds.other;
    return attackSpeeds[weaponName] || attackSpeeds.other;
}

function getCooldown(weaponName) {
    const speed = getAttackSpeed(weaponName);
    return Math.floor(1 / speed * 20);
}

var isShieldActive = false

// Pew pew

var attackHits = 0
var mvTick = 0

function checkForTargets() {
    const filter = e => targets.includes(e.username) || targets.includes(e.name)

    const entity = UltimateBot.nearestEntity(filter)
    const minimumDistance = 5.5

    if (entity) {
        attackTick += 1
        mvTick += 1
        if (mvTick > 10) {
            mvTick = 0
            UltimateBot.moveTo(entity.position)
        }
        /*
        If it finds a valid target
        it will enter combat bot.state
        */
        UltimateBot.state = 'combat'

        if (UltimateBot.health > 15 || UltimateBot.food > 19 || !UltimateBot.hasFood()) {
            /*
            Perform combat as long as the bot
            either is in good stat conditions
            or does not have any food to
            metigate the stats
            
            Gets cooldown in ticks for the
            current weapon and uses it to
            time the attacks properly
            ticksPerAttack is also used to
            time crits
            */
            let ticksPerAttack
            const mainHand = UltimateBot.inventory.slots[UltimateBot.getEquipmentDestSlot('hand')]
            if (mainHand) {
                ticksPerAttack = getCooldown(UltimateBot.inventory.slots[UltimateBot.getEquipmentDestSlot('hand')].name)
            }
            else {
                ticksPerAttack = 5
            }

            UltimateBot.lookAt(entity.position)
            UltimateBot.substate = 'moving'

            /*
            attackHits is used to eventually change
            main weapon to axe, useful when fighting
            targets that posses shields.
            Also, if the target is far, the bot will
            also equip an axe, as it has enough time
            to charge it.
            After using the axe, the weapon is changed
            to a sword, that has more damage per
            second.
            */
            if (attackHits > 3) {
                equipForCombat(true)
                attackHits = 0
            }
            if (entity.position.distanceTo(UltimateBot.entity.position) > minimumDistance + 5) {
                equipForCombat(true)
                UltimateBot.setControlState('jump', true)
            }
            else {
                UltimateBot.setControlState('jump', false)
            }
            UltimateBot.setControlState('sprint', true)
            if (entity.position.distanceTo(UltimateBot.entity.position) < minimumDistance) {
                UltimateBot.setControlState('back', true)
            }

            /*
            Jumps in the (arguably) perfect time to
            get a critical hit in the next 10 ticks
            */
            if (attackTick > ticksPerAttack - 10 && entity.position.distanceTo(UltimateBot.entity.position) < minimumDistance) {
                UltimateBot.setControlState('jump', false)
                UltimateBot.setControlState('forward', true)
                UltimateBot.substate = 'attacking'
            }

            /*
            Perform the attack at the proper tick
            for current weapon cooldown
            */
            if (attackTick > ticksPerAttack && entity.position.distanceTo(UltimateBot.entity.position) < minimumDistance) {
                //bot.stopDigging()
                attackTick = 0      // Reseting ticks
                UltimateBot.setControlState('sprint', false)
                UltimateBot.attack(entity)
                equipForCombat()    // Equips sword
                attackHits += 1

                UltimateBot.substate = 'idle'
            }
            else {
                // Shield management
                if (hasShield() && attackTick < (ticksPerAttack / 1.1) && entity.position.distanceTo(UltimateBot.entity.position) < minimumDistance + 3) {
                    if (!isShieldActive) {
                        isShieldActive = true
                        UltimateBot.activateItem(true)
                        UltimateBot.substate = 'defending'
                    }
                }
                else if (isShieldActive) {
                    isShieldActive = false
                    UltimateBot.deactivateItem(true);
                    if (UltimateBot.substate === 'defending')
                        UltimateBot.substate = 'idle'
                    if (attackTick < ticksPerAttack) {
                        UltimateBot.setControlState('forward', false)
                        UltimateBot.setControlState('back', true)
                    }
                }
            }
        }
        else {
            attackTick = 0
            if (eatTick > 30) {
                if (isShieldActive) {
                    isShieldActive = false
                    UltimateBot.deactivateItem(true);
                }
                if (UltimateBot.health < 15 && bot.food < 20) {
                    UltimateBot.setControlState('forward', true)
                    UltimateBot.setControlState('jump', true)
                    UltimateBot.setControlState('sprint', true)
                    UltimateBot.substate = 'eating'
                    UltimateBot.eat()
                    eatTick = 0
                }
            }
        }
    } else {
        if (UltimateBot.state === 'combat') {
          UltimateBot.state = 'idle'
          UltimateBot.substate = 'none'

          if (isShieldActive) {
              isShieldActive = false
              UltimateBot.deactivateItem(true);
          }
      }
    }
    eatTick += 1
}

module.exports = {
    load: load,
}