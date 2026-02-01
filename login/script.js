import { deviceKey } from '../src/admin.js';
import { getUserData } from "../src/admin.js";

const loginView = document.getElementById("login-view");
const userView = document.getElementById("user-view");
const loadingView = document.getElementById("loading-view");
const key = deviceKey();

const ranks = {
    0: "Pas un tacos",
    1: "Petit Tacos",
    2: "Le classique T1",
    3: "Simple, un T2",
    4: "Le bon T4",
    5: "T4 bien géchar"
}

document.addEventListener("DOMContentLoaded", async () => {
    const loader = document.getElementById("gate-loader");

    if (sessionStorage.getItem(key) !== "1" && sessionStorage.getItem(key) !== "validated") {
        window.location.replace("/");
    } else {
        await initApp();
        document.body.classList.add("validated");
        loader.classList.add("hide");
    }
});

async function initApp() {
    document.addEventListener("keydown", async (e) => {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
            document.body.classList.toggle("reveal-secret");
            if (document.body.classList.contains("reveal-secret")) {
                await updateSecretPanel();
            }
        }
    });

    window.login = async function () {
        const email = document.getElementById("email");
        const password = document.getElementById("password");

        if (email.value === "" || password.value === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        loadingView.style.display = "block";
        loginView.style.display = "none";
        userView.style.display = "none";

        const { error } = await sb.auth.signInWithPassword({
            email: email.value.toLowerCase(),
            password: password.value
        });

        if (error) {
            if (error.message === "Invalid login credentials") {
                alert("Erreur de connexion : Identifiant ou mot de passe incorrect.");
            } else {
                alert("Une erreur est survenue. Réessaie plus tard.");
            }
        } else {
            await sb
                .from("UsersData")
                .update({ last_sign_in_at: new Date().toISOString() })
                .eq("email", email.value.toLowerCase());
        }

        await updateSecretPanel();
    }

    window.logout = async function () {
        loadingView.style.display = "block";
        loginView.style.display = "none";
        userView.style.display = "none";

        await sb.auth.signOut();
        sessionStorage.removeItem(key);
        alert("Deconnexion effectuee.");
        await updateSecretPanel();
        window.location.reload();
    }

    async function updateSecretPanel() {
        const { data: { session } } = await sb.auth.getSession();
        const user = session?.user;

        if (!user) {
            loginView.style.display = "block";
            loadingView.style.display = "none";
            userView.style.display = "none";
            return;
        }
        const userData = await getUserData("");

        document.getElementById("session-id").textContent = userData.pseudo;
        document.getElementById("user-email").textContent = user.email;
        document.getElementById("user-created-at").textContent =
            new Date(user.created_at).toLocaleString("fr-FR");
        document.getElementById("user-connected-at").textContent =
            new Date(user.last_sign_in_at).toLocaleString("fr-FR");

        document.getElementById("user-rank").innerHTML = ranks[userData.rank];
        sessionStorage.setItem(key, "validated");

        userView.style.display = "block";
        loginView.style.display = "none";
        loadingView.style.display = "none";
    }

    window.redirect = async function () {
        window.location.replace("../main/index.html");
    }
}