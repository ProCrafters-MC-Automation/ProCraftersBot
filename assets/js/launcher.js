const { ipcRenderer } = require('electron')

ipcRenderer.on('open-launcher-paths-selected', (event, arg) => {
  launcher.handler.outputSelectedPathsFromOpenLauncher(arg);
})

ipcRenderer.on('show-message-box-response', (event, args) => {
  launcher.handler.outputMessageboxResponse(args);
})

window.launcher = window.launcher || {},
  function (n) {

    launcher.handler = {

      showOpenLauncher: function () {
        ipcRenderer.send('show-open-launcher');
      },

      outputSelectedPathsFromOpenLauncher: function (paths) {
        alert('user selected: ' + paths);
      },

      outputMessageboxResponse: function (args) {
        alert('user selected button index: ' + args[0] + '. Should remember answer value is: ' + args[1]);
      },

      showErrorBox: function () {
        ipcRenderer.send('show-error-box');
      },

      showMessageBox: function () {
        ipcRenderer.send('show-message-box');
      },

      showSaveLauncher: function () {
        ipcRenderer.send('show-save-launcher');
      },

      init: function () {
        $('#showOpenlauncher').click(function () {
          launcher.handler.showOpenLauncher();
        })

        $('#showErrorBox').click(function () {
          launcher.handler.showErrorBox();
        })

        $('#showMessageBox').click(function () {
          launcher.handler.showMessageBox();
        })

        $('#showSaveLauncher').click(function () {
          launcher.handler.showSaveLauncher();
        })
      }
    };

    n(function () {
      launcher.handler.init();
    })
  }(jQuery);
