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
    const userData = await getUserData("");
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
    window.promote = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
        /*const email = prompt("Entrez l'adresse e-mail de l'utilisateur à promouvoir :");

        const { data: { session }, error: sessionError } = await sb.auth.getSession();
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
        alert("Cette fonctionnalité n'est pas encore disponible.");
        /*const email = prompt("Entrez l'adresse e-mail de l'utilisateur à dégrader :");

        const { data: { session }, error: sessionError } = await sb.auth.getSession();
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

    window.ban = async function () {
        alert("Cette fonctionnalité n'est pas encore disponible.");
        /*const email = prompt("Entrez l'adresse e-mail de l'utilisateur à supprimer des administrateurs :");

        const { data: { session }, error: sessionError } = await sb.auth.getSession();
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
            const div = document.createElement("div");
            div.className = "token-item";

            div.innerHTML = `
                <span>
                    Pour <strong>${t.user_sent}</strong> : 
                    <code>${t.token}</code><br>
                    <small>Expire le ${new Date(t.expires_at).toLocaleString("fr-FR")}</small>
                </span>
                <button class="token-delete" onclick="delete_token('${t.token}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            list.appendChild(div);
        });

    }

    window.closeTokensPopup = function () {
        document.getElementById("tokens-popup").style.display = "none";
    };

    window.see_users = async function () {
        window.location.href = "../users/index.html";
    }
}

checkPath(4);