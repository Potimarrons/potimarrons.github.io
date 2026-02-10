import { getUserData } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

let current_kebab = null;

document.addEventListener("DOMContentLoaded", async () => {
    const userData = await getUserData("");
    const kebabs_box = document.getElementById("kebabs-box");

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    if (userData.rank >= 1) {
        await initApp();
        const { data: kebabs, error } = await sb
            .from("KebabsData")
            .select("*")

        kebabs.forEach(kebab => {
            const folder = document.createElement("div");
            folder.className = "kebab-folder";

            folder.innerHTML = `
                <div class="folder-icon">
                    <i class="fa-solid fa-folder"></i>
                </div>
                <div class="folder-title">
                    ${kebab.title}
                </div>
            `;

            folder.addEventListener("click", () => {
                document.body.style.overflow = "hidden";
                display_info(kebab);
                current_kebab = kebab;
                if (kebab.owner_email == userData.email || userData.rank >= 4) {
                    document.getElementById("open-form-kebab-btn").style.display = "inline";
                    document.getElementById("delete-kebab-btn").style.display = "inline";
                } else {
                    document.getElementById("open-form-kebab-btn").style.display = "inline";
                    document.getElementById("delete-kebab-btn").style.display = "inline";
                }
            });

            kebabs_box.appendChild(folder);
        });
        document.getElementById("staff-panel").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        document.getElementById("access-denied").style.display = "none";
    } else {
        document.getElementById("access-denied").style.display = "block";
        document.getElementById("access-loading").style.display = "none";
        document.getElementById("staff-panel").style.display = "none";
    }

    if (userData.rank >= 3) {
        document.getElementById("admin-button").style.display = "block";
    }
});

async function initApp() {
    document.getElementById("kebab-title-input").addEventListener("input", () => {
        document.getElementById("title-counter").textContent = `${document.getElementById("kebab-title-input").value.length}/${20}`;
    });

    document.getElementById("kebab-short-desc-input").addEventListener("input", () => {
        document.getElementById("short-desc-counter").textContent = `${document.getElementById("kebab-short-desc-input").value.length}/${200}`;
    });

    window.openKebabForm = async function (action) {
        if (action == "add") {
            document.getElementById("kebab-title-input").value = "";
            document.getElementById("kebab-users-input").value = "";
            document.getElementById("kebab-short-desc-input").value = "";
            document.getElementById("kebab-full-desc-input").value = "";
        } else if (action == "edit") {
            const title = current_kebab.title;
            const users = current_kebab.users_inside;
            const short_desc = current_kebab.short_description;
            const full_desc = current_kebab.complete_description;

            document.getElementById("kebab-title-input").value = title;
            document.getElementById("kebab-users-input").value = users;
            document.getElementById("kebab-short-desc-input").value = short_desc;
            document.getElementById("kebab-full-desc-input").value = full_desc;
        }

        document.getElementById("kebabs-form").style.display = "flex";
    }

    window.save_kebab = async function () {
        const title = document.getElementById("kebab-title-input").value;
        const users = document.getElementById("kebab-users-input").value;
        const short_desc = document.getElementById("kebab-short-desc-input").value;
        const full_desc = document.getElementById("kebab-full-desc-input").value;

        if (title == "" || users == "" || full_desc == "") {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        if (current_kebab == null) {
            const { data: { session }, error: sessionError } = await sb.auth.getSession();
            const email = session.user.email;
            const { data, error } = await sb
                .from("KebabsData")
                .insert({
                    owner_email: email,
                    title: title,
                    users_inside: users,
                    short_description: short_desc,
                    complete_description: full_desc,
                    tags: "",
                })

            if (error) {
                alert("Une erreur est survenue. Vous n'avez probablement pas les droits pour créer un kebab.");
                return;
            }
        } else {
            const { data, error } = await sb
                .from("KebabsData")
                .update({
                    title: title,
                    users_inside: users,
                    short_description: short_desc,
                    complete_description: full_desc,
                    last_edit_at: new Date(),
                })
                .eq("kebab_id", current_kebab.kebab_id)
                .single();

            if (error) {
                alert("Une erreur est survenue. Vous n'avez probablement pas les droits pour modifier le kebab.");
                return;
            }
        }
        alert("Kebab enregistré.");
        document.getElementById("kebabs-form").style.display = "none";
        window.location.reload();
    }

    window.deleteKebab = async function () {
        const { data, error } = await sb
            .from("KebabsData")
            .delete()
            .eq("kebab_id", current_kebab.kebab_id)
            .single();

        if (error) {
            alert("Une erreur est survenue. Vous n'avez probablement pas les droits pour supprimer le kebab.");
            return;
        }
        alert("Kebab supprimé.");
        document.getElementById("kebabs-form").style.display = "none";
        window.location.reload();
    }

    window.redirect = async function () {
        window.location.href = ("../admin/index.html");
    }

    globalThis.display_info = async function (kebab) {
        document.getElementById("kebab-title").textContent = kebab.title;
        document.getElementById("kebab-users").textContent = kebab.users_inside;
        document.getElementById("kebab-short-desc").textContent = kebab.short_description;
        document.getElementById("kebab-full-desc").textContent = kebab.complete_description;
        document.getElementById("kebab-created").textContent = new Date(kebab.created_at).toLocaleString("fr-FR");;
        document.getElementById("kebab-last-edit").textContent = new Date(kebab.last_edit_at).toLocaleString("fr-FR");

        document.getElementById("kebabs-popup").style.display = "flex";
    }

    window.closeKebabPopup = function () {
        document.body.style.overflow = "";
        document.getElementById("kebabs-popup").style.display = "none";
        current_kebab = null;
    }

    window.closeKebabForm = function () {
        document.getElementById("kebabs-form").style.display = "none";
    }
}

checkPath(1);
