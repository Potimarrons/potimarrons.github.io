import { is_admin, getUserData } from "../src/admin.js";

var ranks = {
    0: "Utilisateur",
    1: "Guardien",
    2: "Modérateur",
    3: "Resp. Modérateurs",
    4: "Administrateur",
    5: "Resp. Administrateurs"
};

async function display_info(email) {
    document.getElementById("session-id").innerHTML = "chargement...";
    document.getElementById("user-email").textContent = "chargement...";
    document.getElementById("user-created-at").textContent = "chargement...";
    document.getElementById("user-connected-at").textContent = "chargement...";
    document.getElementById("user-admin").innerHTML = "chargement...";

    const userData = await getUserData(email);

    document.getElementById("show-user-info").style.display = "block";

    document.getElementById("session-id").innerHTML = "<span style=\"color: #d1ffe7ff;\">" + userData.pseudo + "</span>";
    document.getElementById("user-email").textContent = userData.email;
    document.getElementById("user-created-at").textContent = new Date(userData.created_at).toLocaleString("fr-FR");
    document.getElementById("user-connected-at").textContent = new Date(userData.last_connexion_at).toLocaleString("fr-FR");

    const admin = await is_admin(email, 1);
    document.getElementById("user-admin").innerHTML = admin ? "<a class=\"admin-link\" href=\"../admin/index.html\">Oui</a>" : "<span style=\"color: red;\">Non</span>";
}

document.addEventListener("DOMContentLoaded", async () => {
    const admin = await is_admin("", 4);
    const panel = document.getElementById("panel");
    const accessRefused = document.getElementById("access-refused");
    const accessWaiting = document.getElementById("access-waiting");
    const users_box = document.getElementById("users-box");

    /*if (admin) {
        const { data: users, error } = await sb
            .from("DataUsers")
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
        panel.style.display = "block";
        accessWaiting.style.display = "none";
    } else {
        accessRefused.style.display = "block";
        accessWaiting.style.display = "none";
    }*/
});