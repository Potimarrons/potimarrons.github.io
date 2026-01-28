export async function getUserData(email = "") {
    if (!email) {
        const { data: { session }, error: sessionError } = await sb.auth.getSession();
        if (sessionError || !session?.user) return null;
        email = session?.user.email;
    }

    const { data: userData, error: userError } = await sb
        .from("UsersData")
        .select("*")
        .eq("email", email)
        .single();

    return userData;
}

export async function is_admin(user_email, rank, user_data = null) {
    if (user_email === "") {
        const { data: { session }, error } = await sb.auth.getSession();
        var email = session?.user.email;
        if (!email) return rank === 0;
    } else {
        var email = user_email;
    }

    const userData = user_data || await getUserData(email);

    console.log("is_admin", email, userData, rank);
    return userData?.rank >= rank;
}
export function deviceKey() {
    const base = [
        navigator.platform,
        navigator.hardwareConcurrency,
        navigator.deviceMemory,
        screen.width,
        screen.height,
        window.devicePixelRatio,
        "potimarron-fibo-42" // ← sel fixe
    ].join("|");

    return btoa(base).slice(0, 64);
}