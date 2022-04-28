const basicSettingsForm = document.getElementById("basic-settings-form");
const submitButton = document.getElementById("basic-settings-form-submit");

submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    const ip = basicSettingsForm.server.value + " " + basicSettingsForm.port.value;
    const version = basicSettingsForm.version.value;
    sessionStorage.setItem('ip', ip);
    sessionStorage.setItem('version', version);
    console.log(ip + " " + version);

    alert("Successfully saved Data.");
    location.reload();
    window.location.href = "launcher.html";
})