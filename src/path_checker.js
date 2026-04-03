// SRC/PATH_CHECKER.JS
import { deviceKey } from "../src/admin.js";

export async function checkPath(rank) {
    const key = deviceKey();

    if (sessionStorage.getItem(key) !== "validated") {
        location.href = "../refused.html";
        return false;
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) {
        location.href = "../refused.html";
        return false;
    }

    // Rang + maintenance en parallèle (1 aller-retour de moins)
    const [rankRes, maintRes] = await Promise.all([
        sb.from("UsersData").select("rank").eq("email", session.user.email).single(),
        sb.from("SiteSettings").select("value").eq("key", "maintenance").single()
    ]);

    const userRank = rankRes.data?.rank ?? 0;

    if (rank > 0 && userRank < rank) {
        location.href = "../refused.html";
        return false;
    }

    if (maintRes.data?.value === "true" && userRank < 5) {
        location.href = "../maintenance.html";
        return false;
    }

    return true;
}