// SRC/PATH_CHECKER.JS
import { deviceKey } from "../src/admin.js";

/**
 * Vérifie que l'utilisateur est authentifié et a le rang minimum requis.
 * Redirige vers refused.html si ce n'est pas le cas.
 * @param {number} rank - Rang minimum.
 * @returns {Promise<boolean>} true si autorisé, false sinon (et redirection déjà effectuée).
 */
export async function checkPath(rank) {
    const key = deviceKey();

    // Vérification synchrone rapide
    if (sessionStorage.getItem(key) !== "validated") {
        location.href = "../refused.html";
        return false;
    }

    // Vérification de session Supabase
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) {
        location.href = "../refused.html";
        return false;
    }

    // Vérification du rang en base
    if (rank > 0) {
        const { data } = await sb
            .from("UsersData")
            .select("rank")
            .eq("email", session.user.email)
            .single();

        if (!data || data.rank < rank) {
            location.href = "../refused.html";
            return false;
        }
    }

    return true;
}