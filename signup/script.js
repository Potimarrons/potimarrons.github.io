import { deviceKey } from '../src/admin.js';

const signupView = document.getElementById("signup-view");
const connectedView = document.getElementById("connected-view");
const loadingView = document.getElementById("loading-view");
const key = deviceKey();

document.addEventListener("DOMContentLoaded", async () => {
    const loader = document.getElementById("gate-loader");

    if (sessionStorage.getItem(key) !== "1" && sessionStorage.getItem(key) !== "validated") {
        window.location.replace("/");
    } else {
        initApp();
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

    async function updateSecretPanel() {
        const { data: { session } } = await sb.auth.getSession();
        const user = session?.user;

        if (!user) {
            signupView.style.display = "block";
            loadingView.style.display = "none";
            connectedView.style.display = "none";
            return;
        }

        connectedView.style.display = "block";
        signupView.style.display = "none";
        loadingView.style.display = "none";
    }

    window.redirect = async function () {
        window.location.replace("../main/index.html");
    }

    window.signup = async function () {
        const email = document.getElementById("email");
        const pseudo = document.getElementById("pseudo");
        const password = document.getElementById("password");
        const password2 = document.getElementById("password2");
        const token = document.getElementById("token");

        if (email.value === "" || password.value === "" || password2.value === "") {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        if (password.value !== password2.value) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 8) {
            alert("Votre mot de passe doit faire au minimum 8 caractères.")
            return;
        }

        if (!/[a-z]/.test(password.value)) {
            alert("Votre mot de passe doit contenir au moins une lettre minuscule.");
            return;
        }

        if (!/[A-Z]/.test(password.value)) {
            alert("Votre mot de passe doit contenir au moins une lettre majuscule.");
            return;
        }

        if (!/[0-9]/.test(password.value)) {
            alert("Votre mot de passe doit contenir au moins un chiffre.");
            return;
        }

        if (!/[^a-zA-Z0-9]/.test(password.value)) {
            alert("Votre mot de passe doit contenir au moins un caractère spécial.");
            return;
        }

        if (pseudo.value.length < 6 || pseudo.value.length > 20) {
            alert("Le pseudo doit contenir entre 8 et 20 caractères.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            alert("Format d'email invalide. Veuillez réessayer avec une adresse email valide.");
            return;
        }

        const { data, error } = await sb.rpc(
            'consume_token_and_create_user',
            { p_token: token.value, p_email: email.value, p_pseudo: pseudo.value }
        );

        if (data === false) {
            alert("Le token fourni n'est pas valide.");
            return;
        }

        if (error) {
            if (error.message.startsWith("duplicate key value violates unique constraint")) {
                alert("Cet email ou ce pseudo est deja pris.");
            }
            return;
        }

        const { error: signupError } = await sb.auth.signUp({
            email: email.value.toLowerCase(),
            password: password.value
        });

        if (signupError) {
            if (signupError.message === "User already registered") {
                alert("Cet email est déjà utilisé.<br>Déjà un compte ? Connectez-vous !");
            } else if (signupError.message === "Unable to validate email address: invalid format") {
                alert("Format d'email invalide. Veuillez réessayer avec une adresse email valide.");
            } else if (signupError.message.includes("Password should be at least") || signupError.message.includes("Password should contain at least") || signupError.message.includes("Unprocessable Content")) {
                alert("Le mot de passe ne remplit pas les critères de sécurité. Il doit contenir au moins 8 caractères et doit contenir au moins une lettre majuscule, une lettre minuscule, un charactère spécial et un chiffre.");
            } else {
                alert("Une erreur est survenue. Réessaie plus tard.");
            }
            await sb.rpc(
                'rollback_user',
                { p_token: token.value, p_email: email.value }
            );
            return;
        } else {
            alert("Le compte à l'email " + email.value.toLowerCase() + " a été créé avec succès ! Vous pouvez maintenant vous connecter.");

            email.value = "";
            password.value = "";
            password2.value = "";
            pseudo.value = "";
            token.value = "";
        }
    }
}