// import exec from 'child_process';

//Buttons
const bodyguardsButton = document.getElementById("bodyguard-start");
const resourcesButton = document.getElementById("resource-start");
const ultimateButton = document.getElementById("ultimate-start");

//Form-ids
const bodyguardsForm = document.getElementById("bodyguard-form");
const resourcesForm = document.getElementById("resource-form");
const ultimateForm = document.getElementById("ultimate-form");

//Basic Settings
// const ip = sessionStorage.getItem('ip');
// const version = sessionStorage.getItem('version');

bodyguardsButton.addEventListener("click", (e) => {
    e.preventDefault();
    // console.log("Bodyguards button clicked");
    // // const bodyguardPrefix = bodyguardsForm.Prefix.value;
    // // const bodyguardQuantity = bodyguardsForm.Quantity.value;
    // const bodyguardPrefix = "bodyguard";
    // const ip = "localhost 25565";
    // const bodyguardQuantity = "5";
    // const version = "1.18.1";
    // console.log("Working");
    // //node bodyguards.js Bodyguard localhost 25565 5 1.17.1

    // const command = "cd .. && cd BodyguardBots && node bodyguards.js " + bodyguardPrefix + " " + ip + " " + bodyguardQuantity + " " + version;
    // console.log(command);
    // exec(command, function (error, stdout, stderr) {
    //     console.log('stdout: ' + stdout);
    //     console.log('stderr: ' + stderr);
    //     if (error !== null) {
    //          console.log('exec error: ' + error);
    //     }
    // });

    // const execSync = require('child_process').execSync;
    // // import { execSync } from 'child_process';  // replace ^ if using ES modules

    // const output = execSync('ls', { encoding: 'utf-8' });  // the default is 'buffer'
    // console.log('Output was:\n', output);


    console.log("Done");

    alert("Bodyguard Bots Activated");
})
resourcesButton.addEventListener("click", (e) => {
    e.preventDefault();
    const bossName = resourcesForm.bossName.value;
    // const command = "cd .. && cd ResourceBots && node index.js " + ip + " " + "Password" + bossName + version;
    // exec(command, function (error, stdout, stderr) {
    //     console.log('stdout: ' + stdout);
    //     console.log('stderr: ' + stderr);
    //     if (error !== null) {
    //          console.log('exec error: ' + error);
    //     }
    // });

    alert("Resource Bots Activated.");
})
ultimateButton.addEventListener("click", (e) => {
    e.preventDefault();
    const ultimateName = ultimateForm.ultimateName.value;
    // const command = "cd .. && cd UltimateBot && node main.js " + ultimateName + ip + " " + version;
    // exec(command, function (error, stdout, stderr) {
    //     console.log('stdout: ' + stdout);
    //     console.log('stderr: ' + stderr);
    //     if (error !== null) {
    //          console.log('exec error: ' + error);
    //     }
    // });

    alert("Ultimate Bot Activated");  
})
