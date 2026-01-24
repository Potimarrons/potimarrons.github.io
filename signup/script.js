async function signup() {
    const email = document.getElementById("email");
    const pseudo = document.getElementById("pseudo");
    const password = document.getElementById("password");
    const password2 = document.getElementById("password2");
    const errorText = document.getElementById("error");

    if (email.value === "" || password.value === "" || password2.value === "") {
        errorText.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    if (password.value !== password2.value) {
        errorText.textContent = "Les mots de passe ne correspondent pas.";
        return;
    }

    if (pseudo.value !== "" && pseudo.value.length < 6 || pseudo.value.length > 20) {
        errorText.textContent = "Le pseudo doit contenir entre 6 et 20 caractères.";
        return;
    } 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        errorText.textContent = "Format d'email invalide. Veuillez réessayer avec une adresse email valide.";
        return;
    }

    errorText.style.color = "white";
    errorText.textContent = "Vérification du pseudo en cours...";
    /*const { data: pseudoData, error: pseudoError } = await sb
        .from("DataUsers")
        .select("*")
        .eq("pseudo", pseudo.value)
        .maybeSingle();
    
    if (pseudoData) {
        errorText.style.color = "red";
        errorText.textContent = "Ce pseudo est deja pris.";
        return;
    }*/

    errorText.style.color = "white";
    errorText.textContent = "Pseudo vérifié. Inscription en cours ...";

    /*const { error } = await sb.auth.signUp({
        email: email.value.toLowerCase(),
        password: password.value
    });

    errorText.style.color = "red";

    if (error) {
        console.error(error);
        if (error.message === "User already registered") {
            errorText.innerHTML = "Cet email est déjà utilisé.<br>Déjà un compte ? Connectez-vous !";
        } else if (error.message === "Unable to validate email address: invalid format") {
            errorText.textContent = "Format d'email invalide. Veuillez réessayer avec une adresse email valide.";
        } else if (error.message.includes("Password should be at least") || error.message.includes("Password should contain at least")) {
            errorText.textContent = "Le mot de passe ne remplit pas les critères de sécurité.";
            if (error.message.includes("8 characters")) {
                errorText.textContent += " Il doit contenir au moins 8 caractères.";
            } else if (error.message.includes("Password should contain at least one character of each")) {
                errorText.textContent += " Il doit contenir au moins une lettre majuscule, une lettre minuscule, un charactère spécial et un chiffre.";
            }
        } else {
            errorText.textContent = "Une erreur est survenue. Réessaie plus tard.";
        }
        return;
    } else {
        errorText.textContent = "";

        const row = { email: email.value.toLowerCase(), created_at: new Date().toISOString() };
        if (pseudo.value !== "") {
            row.pseudo = pseudo.value;
        }
        await sb.from("DataUsers").insert([row]);

        alert("Le compte à l'email " + email.value.toLowerCase() + " a été créé avec succès ! Vous pouvez maintenant vous connecter.");
        
        email.value = "";
        password.value = "";
        password2.value = "";
        pseudo.value = "";
    }*/
}