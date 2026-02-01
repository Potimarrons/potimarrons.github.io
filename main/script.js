import { getUserData } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userData = await getUserData("");
    const superAdmin = document.querySelectorAll(".super-admin");

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    if (userData.rank >= 1) {
        await initApp();
        if (userData.rank >= 5) {
            superAdmin.forEach(elem => {
                elem.style.display = "block";
            });
        }
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
    window.see_kebabs = async function () {
        window.location.href = ("../potimarrons/index.html");
    }

    window.add_kebab = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
    }

    window.remove_kebab = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
    }

    window.edit_kebab = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
    }

    window.redirect = async function () {
        window.location.href = ("../admin/index.html");
    }
}

checkPath(1);
