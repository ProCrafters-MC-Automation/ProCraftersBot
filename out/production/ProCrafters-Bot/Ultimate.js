const basicSettingsForm = document.getElementById("basic-settings-form");
const basisSettingsButton = document.getElementById("basic-settings-form-submit");
const basicSettingsErrorMsg = document.getElementById("basic-settings-error-msg");

const server = basiSettingsForm.server.value;
const port = basicSettingsForm.port.value;
const version = basicSettingsForm.version.value;

	switch(tokens[0]) {
		case 'Bodyguards':
			var Bodyguards = exec('sh bodyguard.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

			break;

        case 'PrinterCommands':
            var PrinterCommands = exec('sh printerCommands.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

            break;
        
        case 'Printer3D':
            var Printer3D = exec('sh printer3D.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
            break;
        
        case 'Resources':
            var Resources = exec('sh resources.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
            break;
        
        case 'Ultimate':
            var Ultimate = exec('sh ultimate.sh',
            (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
            break;
	}