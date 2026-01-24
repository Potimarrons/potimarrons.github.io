import { is_admin, getUserData } from "../src/admin.js";

window.login = async function () {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const errorText = document.getElementById("error");
    errorText.style.color = "red";

    if (email.value === "" || password.value === "") {
        errorText.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    errorText.style.color = "white";
    errorText.textContent = "Connexion en cours ..."

    /*const { error } = await sb.auth.signInWithPassword({
        email: email.value.toLowerCase(),
        password: password.value
    });

    if (error) {
        errorText.style.color = "red";
        if (error.message === "Invalid login credentials") {
            errorText.innerHTML = "Erreur de connexion : Identifiant ou mot de passe incorrect.<br>Pas de compte ? Inscrivez-vous !";
        } else {
            errorText.textContent = "Une erreur est survenue. Réessaie plus tard.";
        }
    } else {
        await sb
            .from("DataUsers")
            .update({ last_connexion_at: new Date().toISOString() })
            .eq("email", email.value.toLowerCase());
        errorText.textContent = "";
        email.value = "";
        password.value = "";
        document.getElementById("signin-page").style.display = "none";
        document.getElementById("access-waiting").style.display = "block";
    }*/
}

window.logout = async function () {
    const errorText = document.getElementById("deletion-log");
    errorText.style.color = "white";
    errorText.textContent = "Deconnexion en cours ...";
    // await sb.auth.signOut();
    errorText.textContent = "";
    errorText.style.color = "red";
    document.getElementById("user-admin").innerHTML = "chargement...";
}

async function display_info() {
    const { data: { session }, error } = await sb.auth.getSession();
    var user = session?.user;

    var userData = await getUserData(user?.email);

    if (!user) {
        document.getElementById("signin-page").style.display = "block";
        document.getElementById("logout-page").style.display = "none";
        document.getElementById("access-waiting").style.display = "none";
        return;
    }

    document.getElementById("session-id").innerHTML = "<span style=\"color: #d1ffe7ff;\">" + userData.pseudo + "</span>";
    document.getElementById("user-email").textContent = user.email;
    document.getElementById("user-created-at").textContent = new Date(user.created_at).toLocaleString("fr-FR");
    document.getElementById("user-connected-at").textContent = new Date(user.last_sign_in_at).toLocaleString("fr-FR");

    const admin = await is_admin("", 1);
    document.getElementById("user-admin").innerHTML = admin ? "<a class=\"admin-link\" href=\"../admin/index.html\">Oui</a>" : "<span style=\"color: red;\">Non</span>";

    document.getElementById("logout-page").style.display = "block";
    document.getElementById("signin-page").style.display = "none";
    document.getElementById("access-waiting").style.display = "none";
}

sb.auth.onAuthStateChange((event, session) => {
    display_info();
});