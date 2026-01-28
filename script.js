import { deviceKey } from "./src/admin.js";

window.generateKey = function () {
    const key = deviceKey();
    if (sessionStorage.getItem(key) !== "validated") {
        sessionStorage.setItem(key, "1");
    }
}