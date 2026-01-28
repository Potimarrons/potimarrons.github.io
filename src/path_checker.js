import { is_admin, deviceKey } from "../src/admin.js";

export async function checkPath(rank) {
    const key = deviceKey();
    if (sessionStorage.getItem([key]) !== "validated" || !await is_admin("", rank)) {
        location.href = "../refused.html";
    }
}
