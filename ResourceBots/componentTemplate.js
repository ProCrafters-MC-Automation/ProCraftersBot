let UltimateBot

function load(UltimateBotClass) {
    UltimateBot = UltimateBotClass
    UltimateBot.exampleFunction = exampleFunction
}

function exampleFunction() {
    console.log('hallo')
}

module.exports = {
    load: load,
}