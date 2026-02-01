import { getUserData } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userData = await getUserData("");

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    if (userData.rank >= 1) {
        await initApp();
        document.getElementById("staff-panel").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        document.getElementById("access-denied").style.display = "none";
    } else {
        document.getElementById("access-denied").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        document.getElementById("staff-panel").style.display = "none";
    }

    if (userData.rank >= 4) {
        document.getElementById("admin-button").style.display = "block";
    }
});

async function initApp() {
    window.redirect = async function () {
        window.location.href = ("../admin/index.html");
    }
}

checkPath(1);
