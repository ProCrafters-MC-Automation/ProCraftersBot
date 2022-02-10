lodash = require('lodash')

let UltimateBot

function load(UltimateBotclass) {
    UltimateBot = UltimateBotclass

    UltimateBot.on('physicTick', miningTick)

    UltimateBot.hasFood = hasFood
    UltimateBot.eat = eat
    UltimateBot.getPlayer = getPlayer
    UltimateBot.mountNearest = mountNearest
    UltimateBot.locateBlock = locateBlock
    UltimateBot.mineBlock = mineBlock
    UltimateBot.mineBlockAt = mineBlockAt
    UltimateBot.stopMining = stopMining
}

// Eating
function hasFood() {
    /*
    Returns either there is or not
    available food in the inventory
    */
    const mcData = require('minecraft-data')(UltimateBot.version)
    var data = mcData.foodsArray
    var names = data.map((item) => item.name)

    var found_food = UltimateBot.inventory
        .items()
        .filter((item) => names.includes(item.name))

    if (found_food.length === 0 || !found_food) {
        return false
    }
    return true
}

function eat() {
    /*
    From github.com/LINKdiscordd/mineflayer-auto-eat
    MIT License
    Copyright (c) 2020 Link
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    Returns either it found food in the inventory
    or not (bool)
    */
    const mcData = require('minecraft-data')(UltimateBot.version)
    var data = mcData.foodsArray

    var names = data.map((item) => item.name)
    var foodps = data.map((item) => item.foodPoints)

    var found_food = UltimateBot.inventory
        .items()
        .filter((item) => names.includes(item.name))

    if (found_food.length === 0 || !found_food) {
        return false
    }

    var available_food = []

    UltimateBot.inventory.items().forEach((element) => {
        if (names.includes(element.name)) {
            element.foodPoints = foodps[names.indexOf(element.name)] // item does not contain foodPoints by default
            available_food.push(element)
        }
    })

    var best_food
		best_food = lodash.maxBy(available_food, 'foodPoints')

    if (best_food) {
        /*
        Passing food item to main hand
        and activating the item from
        main hand (which is food)
        */
        UltimateBot.substate = 'eating'
        console.log(best_food)
        console.log(available_food)
        UltimateBot.equip(best_food, 'hand', function () {
            UltimateBot.consume(function () {
                UltimateBot.substate = 'none'
            })
        })
        return true
    }

    return false
}

function getPlayer(username) {
    /*
    Returns the player object for the
    given username, or null if it
    can't find the player
    */
    player = UltimateBot.players[username]
    if (player) return player
    return null
}

function locateBlock(name) {
    /*
    Returns position for the nearest
    block of that kind
    */
    blocks = UltimateBot.findBlockSync({
        point: UltimateBot.entity.position,
        matching: name,
        maxDistance: 128,
        count: 1
    })
    if (blocks.length > 0) {
        return blocks[0].position
    }
    return null
}

var mining = false
var miningCount = 0
var miningName = null

function miningTick() {
    if (mining) UltimateBot.lookAt(mining)
    if (mining && !UltimateBot.targetDigBlock && UltimateBot.canDigBlock(UltimateBot.blockAt(mining))) {
        function finishedMining(err) {
            UltimateBot.stopMoving()
            mining = false
            miningCount -= 1
        }

        target = UltimateBot.blockAt(mining)
        UltimateBot.tool.equipForBlock(target, {}, () => {
            UltimateBot.substate = 'digging'
            UltimateBot.dig(target, finishedMining)
        })
    }
    else if (!mining && miningName && miningCount > 0) {
        position = UltimateBot.locateBlock(miningName)
        if (position) {
            UltimateBot.mineBlockAt(position)
        }
        else {
            miningName = null
        }
    }
}

function mineBlockAt(position) {
    mining = position
    UltimateBot.moveTo(position)
    UltimateBot.substate = 'moving'
}

function mineBlock(name, count = 1) {
    UltimateBot.state = 'mining'
    miningCount = count
    miningName = name
}

function stopMining() {
    mining = false
    miningCount = 0
    miningName = null
    UltimateBot.stopMoving()
    UltimateBot.stopDigging()
    if (UltimateBot.state === 'mining') {
        UltimateBot.state = 'idle'
        UltimateBot.substate = 'none'
    }
}

// Vehicle
// TODO: Vehicle movement

function mountNearest() {
    /*
    Mounts the nearest vehicle
    */

    mountable = ['boat', 'minecart', 'horse', 'donkey']

    const filter = e => e.name && mountable.includes(e.name)
    const entity = UltimateBot.nearestEntity(filter)

    if (entity) {
        UltimateBot.mount(entity)
        return true
    }
    return false
}

module.exports = {
    load: load,
}