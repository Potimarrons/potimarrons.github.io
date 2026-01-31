import { is_admin } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

document.addEventListener("DOMContentLoaded", async () => {
    const hasAccess = await is_admin("", 1);

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    if (hasAccess) {
        document.getElementById("staff-panel").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        document.getElementById("access-denied").style.display = "none";
    } else {
        document.getElementById("access-denied").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        document.getElementById("staff-panel").style.display = "none";
    }
});

checkPath(1);
