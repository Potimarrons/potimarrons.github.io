import { getUserData } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

const ranks = {
    0: "Pas un tacos",
    1: "Petit Tacos",
    2: "Le classique T1",
    3: "Simple, un T2",
    4: "Le bon T4",
    5: "T4 bien géchar"
}

document.addEventListener("DOMContentLoaded", async () => {
    globalThis.userData = await getUserData("");
    const panels = document.querySelectorAll("#panel");
    const superAdmin = document.querySelectorAll(".super-admin");
    const accessRefused = document.getElementById("access-refused");
    const accessWaiting = document.getElementById("access-waiting");

    document.getElementById("gate-loader").classList.add("hide");
    document.body.classList.add("validated");

    if (userData.rank >= 4) {
        await initApp();
        if (userData.rank >= 5) {
            superAdmin.forEach(elem => {
                elem.style.display = "flex";
            });
        }
        panels.forEach(panel => {
            panel.style.display = "block";
        });
        accessWaiting.style.display = "none";
        accessRefused.style.display = "none";
    } else {
        accessRefused.style.display = "block";
        accessWaiting.style.display = "none";
        panels.forEach(panel => {
            panel.style.display = "none";
        });
    }
});

async function initApp() {
    window.display_info = async function (email) {
        const userData = await getUserData(email);

        const select = document.getElementById("user-rank-select");
        select.innerHTML = "";

        for (let r = 0; r <= 5; r++) {
            const option = document.createElement("option");
            option.value = r;
            option.textContent = ranks[r];
            if (r === userData.rank) option.selected = true;
            if (option.value >= globalThis.userData.rank) {
                option.disabled = true;
                option.textContent += " 🔒";
            }
            select.appendChild(option);
        }

        if (globalThis.userData.email === "csj.potin@gmail.com") {
            select.disabled = false;
        } else if (globalThis.userData.rank >= 4 && userData.email !== globalThis.userData.email && globalThis.userData.rank > userData.rank) {
            select.disabled = false;
        } else {
            select.disabled = true;
        }

        select.onchange = async () => {
            const newRank = Number(select.value);

            if (newRank === userData.rank) return;

            const confirmChange = confirm(
                `Changer le rang de ${userData.email} vers "${ranks[newRank]}" ?`
            );

            if (!confirmChange) {
                select.value = userData.rank;
                return;
            }

            const { data, error } = await sb
                .from("UsersData")
                .update({ rank: newRank })
                .eq("email", userData.email)
                .single();

            if (error) {
                alert("Une erreur s'est produite lors de la modification du rang de l'utilisateur.");
                return;
            }

            userData.rank = newRank;
            alert("Le rang de l'utilisateur " + userData.email + " a bien été changé.");
        };


        document.getElementById("session-id").innerHTML = "<span style=\"color: #d1ffe7ff;\">" + userData.pseudo + "</span>";
        document.getElementById("user-email").textContent = userData.email;
        document.getElementById("user-created-at").textContent = new Date(userData.created_at).toLocaleString("fr-FR");
        document.getElementById("user-connected-at").textContent = new Date(userData.last_sign_in_at).toLocaleString("fr-FR");
        document.getElementById("user-token").innerHTML = "<span style=\"color: rgb(143, 143, 143);\">" + userData.token_used + "</span>";

        document.getElementById("user-info-popup").style.display = "block";
    }

    window.see_users = async function () {
        const popup = document.getElementById("users-popup");
        const list = document.getElementById("users-list");

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data, error } = await sb
            .from("UsersData")
            .select("*")
            .order("created_at", { ascending: false });

        if (data.length === 0) {
            list.innerHTML = "<p>Aucun utilisateur.</p>";
            return;
        }

        list.innerHTML = "";
        data.forEach(u => {
            const div = document.createElement("div");
            div.className = "user-item";

            div.innerHTML = `
                <span>
                    <strong>${u.email}</strong><br>
                    <small>Créé le ${new Date(u.created_at).toLocaleString("fr-FR")}</small>
                </span>
            `;

            if (userData.rank >= 3) {
                div.innerHTML += `
                    <button class="user-info" onclick="display_info('${u.email}')">
                        <i class="fa-solid fa-info"></i>
                    </button>
                `;
            }

            list.appendChild(div);
        });
    }

    window.banUser = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
    }

    window.unbanUser = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
    }

    window.create_token = async function () {
        const user = prompt("La personne à qui le token est destiné :");

        if (!user) return;

        const { data, error } = await sb
            .from("TokensData")
            .insert({ user_sent: user });


        if (error) {
            if (error.message.includes("new row violates row-level security")) {
                alert("Vous n'avez pas les droits pour créer un token.");
            } else {
                alert("Une erreur s'est produite lors de la création du token.");
            }
            return;
        }
        await see_unused_tokens();
    }

    window.delete_token = async function (token) {
        const confirmDelete = confirm("Voulez-vous vraiment supprimer ce token ?");

        if (!confirmDelete) return;


        const { data, error } = await sb
            .from("TokensData")
            .delete()
            .eq("token", token);

        if (error) {
            if (error.message.includes("new row violates row-level security")) {
                alert("Vous n'avez pas les droits pour supprimer le token.");
            } else {
                alert("Une erreur s'est produite lors de la supression du token.");
            }
            return;
        }
        await see_unused_tokens();
    }

    window.see_unused_tokens = async function () {
        const popup = document.getElementById("tokens-popup");
        const list = document.getElementById("tokens-list");

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data, error } = await sb
            .from("TokensData")
            .select("*")
            .eq("used", false)
            .order("created_at", { ascending: false });

        if (data.length === 0) {
            list.innerHTML = "<p>Aucun token inutilisé.</p>";
            return;
        }

        list.innerHTML = "";
        data.forEach(t => {
            if (new Date(t.expires_at).getTime() < Date.now()) {
                return;
            }
            const div = document.createElement("div");
            div.className = "token-item";

            div.innerHTML = `
                <span>
                    Pour <strong>${t.user_sent}</strong> : 
                    <code>${t.token}</code><br>
                    <small>Expire le ${new Date(t.expires_at).toLocaleString("fr-FR")}</small>
                </span>
            `;

            if (userData.rank >= 5) {
                div.innerHTML += `
                    <button class="token-delete" onclick="delete_token('${t.token}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
            }

            list.appendChild(div);
        });

        if (list.innerHTML === "") {
            list.innerHTML = "<p>Aucun token inutilisé.</p>";
        }

    }

    window.see_user_inside_data = function (user) {
        alert(`La fonctionnalité pour ${user} n'est pas encore disponible.`);
    }

    window.see_users_inside = async function () {
        const popup = document.getElementById("users-inside-popup");
        const list = document.getElementById("users-inside-list");

        popup.style.display = "block";
        list.innerHTML = "<p>Chargement...</p>";

        const { data, error } = await sb
            .from("KebabsData")
            .select("users_inside")
            .order("created_at", { ascending: false });

        if (!data || data.length === 0) {
            list.innerHTML = "<p>Aucune personne impliquée.</p>";
            return;
        }

        const userCounts = {};

        data.forEach(row => {
            if (!row.users_inside) return;

            row.users_inside
                .split(",")
                .map(name => name.trim())
                .filter(name => name.length > 0)
                .forEach(name => {
                    if (!userCounts[name]) userCounts[name] = 0;
                    userCounts[name]++;
                });
        });

        if (Object.keys(userCounts).length === 0) {
            list.innerHTML = "<p>Aucune personne impliquée.</p>";
            return;
        }

        list.innerHTML = Object.entries(userCounts)
            .map(([user, count]) => `
            <div class="user-item">
                <span>
                    <strong>${user}</strong>
                    <small style="margin-left: 0.5rem; color: var(--muted);">
                        Présent(e) dans ${count} kebab${count > 1 ? "s" : ""}
                    </small>
                </span>
                <button class="user-info" onclick="see_user_inside_data('${user}')">
                    <i class="fa-solid fa-info"></i>
                </button>
            </div>
        `)
            .join("");
    }


    window.closeTokensPopup = function () {
        document.getElementById("tokens-popup").style.display = "none";
    };

    window.closeUsersPopup = function () {
        document.getElementById("users-popup").style.display = "none";
    };

    window.closeUserInfoPopup = function () {
        document.getElementById("user-info-popup").style.display = "none";
    }

    window.closeUsersInsidePopup = function () {
        document.getElementById("users-inside-popup").style.display = "none";
    }
}


checkPath(4);