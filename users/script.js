import { is_admin, getUserData } from "../src/admin.js";
import { checkPath } from "../src/path_checker.js";

const ranks = {
    0: "Pas un tacos",
    1: "Petit Tacos", 
    2: "Le classique T1", 
    3: "Simple, un T2",
    4: "Le bon T4",
    5: "T4 bien géchar"
}

async function display_info(email) {
    document.getElementById("session-id").innerHTML = "chargement...";
    document.getElementById("user-email").textContent = "chargement...";
    document.getElementById("user-created-at").textContent = "chargement...";
    document.getElementById("user-connected-at").textContent = "chargement...";
    document.getElementById("user-rank").innerHTML = "chargement...";

    const userData = await getUserData(email);

    document.getElementById("show-user-info").style.display = "block";

    document.getElementById("session-id").innerHTML = "<span style=\"color: #d1ffe7ff;\">" + userData.pseudo + "</span>";
    document.getElementById("user-email").textContent = userData.email;
    document.getElementById("user-created-at").textContent = new Date(userData.created_at).toLocaleString("fr-FR");
    document.getElementById("user-connected-at").textContent = new Date(userData.last_sign_in_at).toLocaleString("fr-FR");

    document.getElementById("user-rank").innerHTML = ranks[userData.rank];
}

document.addEventListener("DOMContentLoaded", async () => {
    const hasAccess = await is_admin("", 1);

    document.getElementById("main-loader").classList.add("hide");
    document.body.classList.add("validated");

    const users_box = document.getElementById("users-box");

    if (hasAccess) {
        const { data: users, error } = await sb
            .from("UsersData")
            .select("*")

        users.forEach(user => {
            const button = document.createElement("button");
            button.setAttribute("class", "user-button");
            button.innerHTML = `
                <p>${user.email}</p>
                <p>${ranks[user.rank]}</p>
            `;

            button.addEventListener("click", () => {
                display_info(user.email);
            });
            users_box.appendChild(button);
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

checkPath(3);