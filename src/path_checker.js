import { is_admin } from "../src/admin.js";

async function checkProjectAccess() {
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    const projectName = parts[0];

    if (!projectName) return;

    /*const { data, error } = await sb
        .from("CurrentProjects")
        .select("*")
        .eq("project", projectName)
        .single();

    if (data.refused === false) return;
    if (await is_admin("", data.admin)) return;

    window.location.replace("../refused.html");*/
}

checkProjectAccess();