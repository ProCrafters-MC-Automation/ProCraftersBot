import { Bot } from "mineflayer"
import { Entity } from "prismarine-entity"


export function attack (bot: Bot, target: Entity, swing = true) {
    // Fast-path: Ensure weapon is in hand before attacking (prevents hitting with scaffolding blocks)
    if (bot.inventory && bot.inventory.slots) {
      const handSlot = bot.getEquipmentDestSlot ? bot.getEquipmentDestSlot("hand") : 36;
      const held = bot.inventory.slots[handSlot];
      const isWeapon = held && held.name && (held.name.includes("sword") || (held.name.includes("axe") && !held.name.includes("pickaxe")));
      if (!isWeapon) {
        for (let i = 0; i < 9; i++) {
          const item = bot.inventory.slots[36 + i];
          if (item && item.name && (item.name.includes("sword") || (item.name.includes("axe") && !item.name.includes("pickaxe")))) {
            if (bot.quickBarSlot !== i && typeof bot.setQuickBarSlot === "function") {
              bot.setQuickBarSlot(i);
            }
            break;
          }
        }
      }
    }

    // Vanilla sends the attack interaction first, then the swing packet.
    useEntity(bot, target, 1)
    if (swing) {
      swingArm(bot)
    }

  }


  function useEntity (bot: Bot, target: Entity, leftClick: 0 | 1, x?: number, y?: number, z?: number) {
    const sneaking = bot.getControlState('sneak')
    if (x && y && z) {
      bot._client.write('use_entity', {
        target: target.id,
        mouse: leftClick,
        x,
        y,
        z,
        sneaking
      })
    } else {
      bot._client.write('use_entity', {
        target: target.id,
        mouse: leftClick,
        sneaking
      })
    }
  }


  function swingArm (bot: Bot, arm = 'right', showHand = true) {
    const hand = arm === 'right' ? 0 : 1
    const packet = {} as Record<string, any>
    if (showHand) packet.hand = hand
    bot._client.write('arm_animation', packet)
  }
