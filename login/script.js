// LOGIN
import { deviceKey, getUserData } from '../src/admin.js';

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
};

document.addEventListener("DOMContentLoaded", async () => {
    const loader = document.getElementById("gate-loader");

    if (sessionStorage.getItem(key) !== "1" && sessionStorage.getItem(key) !== "validated") {
        window.location.replace("/");
        return;
    }

    await initApp();
    document.body.classList.add("validated");
    loader.classList.add("hide");
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

    // ── Raccourcis clavier ─────────────────────────────────────
    document.getElementById("email")?.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); login(); }
    });
    document.getElementById("password")?.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); login(); }
    });

    // ── Connexion ─────────────────────────────────────────────
    window.login = async function () {
        const email = document.getElementById("email");
        const password = document.getElementById("password");

        if (!email.value || !password.value) {
            alert("Veuillez remplir tous les champs."); return;
        }

        loadingView.style.display = "block";
        loginView.style.display = "none";
        userView.style.display = "none";

        const { error } = await sb.auth.signInWithPassword({
            email: email.value.toLowerCase(),
            password: password.value
        });

        if (error) {
            alert(error.message === "Invalid login credentials"
                ? "Identifiant ou mot de passe incorrect."
                : "Une erreur est survenue. Réessaie plus tard.");
        } else {
            await sb.from("UsersData")
                .update({ last_sign_in_at: new Date().toISOString() })
                .eq("email", email.value.toLowerCase());
        }

        await updateSecretPanel();
    };

    // ── Déconnexion ───────────────────────────────────────────
    window.logout = async function () {
        loadingView.style.display = "block";
        loginView.style.display = "none";
        userView.style.display = "none";

        await sb.auth.signOut();
        sessionStorage.removeItem(key);
        alert("Déconnexion effectuée.");
        await updateSecretPanel();
        window.location.reload();
    };

    // ── Mise à jour du panel ──────────────────────────────────
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
        if (!userData) {
            loginView.style.display = "block";
            loadingView.style.display = "none";
            userView.style.display = "none";
            return;
        }

        document.getElementById("session-id").textContent = userData.pseudo;
        document.getElementById("user-email").textContent = user.email;
        document.getElementById("user-created-at").textContent =
            new Date(user.created_at).toLocaleString("fr-FR");
        document.getElementById("user-connected-at").textContent =
            new Date(user.last_sign_in_at).toLocaleString("fr-FR");
        document.getElementById("user-rank").textContent = ranks[userData.rank] ?? userData.rank;

        // Pré-remplir les champs de profil
        document.getElementById("edit-bio").value = userData.bio || "";
        const currentColor = userData.avatar_color || "#c0392b";
        document.getElementById("edit-avatar-color").value = currentColor;
        // document.getElementById("avatar-preview-dot").style.background = currentColor;

        sessionStorage.setItem(key, "validated");

        userView.style.display = "block";
        loginView.style.display = "none";
        loadingView.style.display = "none";
    }

    // ── Profil utilisateur ────────────────────────────────────
    window.toggleProfileEdit = function () {
        const fields = document.getElementById("profile-edit-fields");
        const chevron = document.getElementById("profile-chevron");
        const isHidden = fields.style.display === "none";
        fields.style.display = isHidden ? "flex" : "none";
        chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    };

    // Live preview du dot couleur
    // document.getElementById("edit-avatar-color")?.addEventListener("input", e => {
    //     document.getElementById("avatar-preview-dot").style.background = e.target.value;
    // });

    window.saveProfile = async function () {
        const bio = document.getElementById("edit-bio").value.trim();
        const color = document.getElementById("edit-avatar-color").value;

        const { error } = await sb.rpc("update_own_profile", {
            p_bio: bio,
            p_avatar_color: color
        });

        if (error) { alert("Erreur : " + error.message); return; }
        alert("Profil mis à jour !");
    };

    window.redirect = async function () {
        window.location.replace("../main/index.html");
    };
}