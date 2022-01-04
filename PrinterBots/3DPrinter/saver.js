const mineflayer = require('mineflayer');
const { performance } = require('perf_hooks');
const fs = require('fs');
const Vec3 = require('vec3').Vec3;
const StartBox = [process.argv[6],process.argv[7],process.argv[8]];
const EndBox = [process.argv[9],process.argv[10],process.argv[11]];
const SchematicName = process.argv[12];

let bot = mineflayer.createBot({
    username: process.argv[2],
    host: process.argv[3],
    port: process.argv[4],
    version: process.argv[5],
    viewDistance: "tiny"
});

bot.on('login', () => {
    console.log(`Logged in ${username} on ${host}!`);
})
bot.on('chat', function (username, message) {

    if (username === bot.username) return

    if (message === 'save') {
        let locations = [];
        let startTime = performance.now();
        //Handle locations
        if (StartBox.x > EndBox.x) {
            for (let iX = StartBox.x; iX > EndBox.x - 1; iX--) {
                if (StartBox.y > EndBox.y) {
                    for (let iY = StartBox.y; iY > EndBox.y - 1; iY--) {
                        if (StartBox.z > EndBox.z) {
                            for (let iZ = StartBox.z; iZ > EndBox.z - 1; iZ--) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        } else {
                            for (let iZ = StartBox.z; iZ < EndBox.z + 1; iZ++) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        }
                    }
                } else {
                    for (let iY = StartBox.y; iY < EndBox.y + 1; iY++) {
                        if (StartBox.z > EndBox.z) {
                            for (let iZ = StartBox.z; iZ > EndBox.z - 1; iZ--) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        } else {
                            for (let iZ = StartBox.z; iZ < EndBox.z + 1; iZ++) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        }
                    }
                }
            }
        } else {
            for (let iX = StartBox.x; iX < EndBox.x + 1; iX++) {
                if (StartBox.y > EndBox.y) {
                    for (let iY = StartBox.y; iY > EndBox.y - 1; iY--) {
                        if (StartBox.z > EndBox.z) {
                            for (let iZ = StartBox.z; iZ > EndBox.z - 1; iZ--) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        } else {
                            for (let iZ = StartBox.z; iZ < EndBox.z + 1; iZ++) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        }
                    }
                } else {
                    for (let iY = StartBox.y; iY < EndBox.y + 1; iY++) {
                        if (StartBox.z > EndBox.z) {
                            for (let iZ = StartBox.z; iZ > EndBox.z - 1; iZ--) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        } else {
                            for (let iZ = StartBox.z; iZ < EndBox.z + 1; iZ++) {
                                locations.push(new Vec3(Math.floor(iX), Math.floor(iY), Math.floor(iZ)));
                            }
                        }
                    }
                }
            }
        }
        let savedata = {};
        if (StartBox.y > EndBox.y) {
            for (let iY = StartBox.y; iY > EndBox.y - 1; iY--) {
                savedata[iY] = [];
            }
        }
        else {
            for (let iY = StartBox.y; iY < EndBox.y + 1; iY++) {
                savedata[iY] = [];
            }
        }
        locations.forEach(location => {
            let blockinfo = bot.blockAt(location);
            if (blockinfo.displayName && blockinfo.displayName != 'Air') {
                savedata[blockinfo.position.y].push({
                    coords: {
                        x: blockinfo.position.x - Math.floor(bot.player.entity.position.x),
                        y: blockinfo.position.y - Math.floor(bot.player.entity.position.y),
                        z: blockinfo.position.z - Math.floor(bot.player.entity.position.z)
                    },
                    type: blockinfo.type,
                    metadata: blockinfo.metadata,
                    stateId: blockinfo.stateId,
                    name: blockinfo.name,
                    displayName: blockinfo.displayName
                })
            }
        })
        let data = JSON.stringify(savedata);
        fs.writeFileSync(SchematicName, data);
        let time = (performance.now() - startTime).toFixed(3);
        console.log(`Area saved in ${time}ms!`)
    }
});