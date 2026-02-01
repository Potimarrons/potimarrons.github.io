import { is_admin, getUserData } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

async function initApp() {
    globalThis.display_info = async function (kebab) {
        document.getElementById("kebab-title").textContent = kebab.title;
        document.getElementById("kebab-users").textContent = kebab.users_inside;
        document.getElementById("kebab-short-desc").textContent = kebab.short_description;
        document.getElementById("kebab-full-desc").textContent = kebab.complete_description;
        document.getElementById("kebab-created").textContent = new Date(kebab.created_at).toLocaleString("fr-FR");;
        document.getElementById("kebab-last-edit").textContent = new Date(kebab.last_edit_at).toLocaleString("fr-FR");

        document.getElementById("show-kebab-info").style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const hasAccess = await is_admin("", 1);

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    const kebabs_box = document.getElementById("kebabs-box");

    await initApp();

    if (hasAccess) {
        const { data: kebabs, error } = await sb
            .from("KebabsData")
            .select("*")

        kebabs.forEach(kebab => {
            const button = document.createElement("button");
            button.setAttribute("class", "kebab-button");
            button.innerHTML = `
                <p>${kebab.title}</p>
            `;

            button.addEventListener("click", () => {
                display_info(kebab);
            });
            kebabs_box.appendChild(button);
        });
        document.getElementById("staff-panel").style.display = "block";
        document.getElementById("access-waiting").style.display = "none";
        document.getElementById("access-refused").style.display = "none";
    } else {
        document.getElementById("access-refused").style.display = "block";
        document.getElementById("access-waiting").style.display = "none";
        document.getElementById("staff-panel").style.display = "none";
    }
});

checkPath(1);