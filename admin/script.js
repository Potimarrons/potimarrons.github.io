import { is_admin, getUserData } from "../src/admin.js";

var ranks = {
    0: "Utilisateur",
    1: "Guardien",
    2: "Modérateur",
    3: "Resp. Modérateurs",
    4: "Administrateur",
    5: "Resp. Administrateurs"
};

window.promote = async function () {
    const email = prompt("Entrez l'adresse e-mail de l'utilisateur à promouvoir :");

    /*const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (!session?.user) {
        alert("Vous devez être connecté.");
        return;
    }
    const user = session?.user;

    const userData = await getUserData(email);

    const { data, error } = await sb.rpc('promote_user', { target_email: email.toLowerCase() });

    if (error) {
        if (error.message.includes("Unauthorized")) {
            alert("Vous n'avez pas les droits pour promouvoir cet utilisateur !");
        } else if (error.message === "Cannot promote yourself") {
            alert("Vous ne pouvez pas vous promouvoir vous-meme.");
        } else if (error.message === "Target user not found") {
            alert("Aucun utilisateur trouvé avec cette adresse e-mail.");
        } else {
            console.error(error);
            alert("Erreur lors de la promotion.");
        }
        return;
    }
    alert("L'utilisateur " + email + " est maintenant un utilisateur de rang : " + ranks[userData.rank+1] + ".");*/
}

window.unpromote = async function () {
    const email = prompt("Entrez l'adresse e-mail de l'utilisateur à dégrader :");

    /*const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (!session?.user) {
        alert("Vous devez être connecté.");
        return;
    }
    const user = session?.user;

    const userData = await getUserData(email);

    const { data, error } = await sb.rpc('demote_user', { target_email: email.toLowerCase() });

    if (error) {
        if (error.message.includes("Unauthorized")) {
            alert("Vous n'avez pas les droits pour dégrader cet utilisateur !");
        } else if (error.message === "Cannot demote yourself") {
            alert("Vous ne pouvez pas vous dégrader vous-meme.");
        } else if (error.message === "Target user not found") {
            alert("Aucun utilisateur trouvé avec cette adresse e-mail.");
        } else {
            console.error(error);
            alert("Erreur lors de la dégradation du rang de l'utilisateur.");
        }
        return;
    }
    alert("L'utilisateur " + email + " est maintenant un utilisateur de rang : " + ranks[userData.rank-1] + ".");*/
}

window.remove_admin = async function () {
    const email = prompt("Entrez l'adresse e-mail de l'utilisateur à supprimer des administrateurs :");

    /*const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (!session?.user) {
        alert("Vous devez être connecté.");
        return;
    }
    const user = session?.user;

    const { data, error } = await sb.rpc('remove_all_admin_rights', { target_email: email.toLowerCase() });

    if (error) {
        if (error.message.includes("Unauthorized")) {
        alert("Vous n'avez pas les droits pour dégrader cet utilisateur !");
        } else if (error.message === "Cannot remove your own admin rights") {
            alert("Vous ne pouvez pas vous dégrader vous-meme.");
        } else if (error.message === "Target user not found") {
            alert("Aucun utilisateur trouvé avec cette adresse e-mail.");
        } else {
            console.error(error);
            alert("Erreur lors de la dégradation du rang de l'utilisateur.");
        }
        return;
    } else {
        alert(`L'utilisateur ${email} n'est plus administrateur et son rang a été remis à 0.`);
    }*/
}

window.see_users = async function () {
    window.location.href = "../users/index.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    const admin = await is_admin("", 2);
    const panel = document.getElementById("panel");
    const superAdmin = document.querySelectorAll(".super-admin");
    const accessRefused = document.getElementById("access-refused");
    const accessWaiting = document.getElementById("access-waiting");

    if (admin) {
        if (await is_admin("", 5) === true) {
            superAdmin.forEach(elem => {
                elem.style.display = "block";
            });
        }
        panel.style.display = "block";
        accessWaiting.style.display = "none";
    } else {
        accessRefused.style.display = "block";
        accessWaiting.style.display = "none";
    }
});