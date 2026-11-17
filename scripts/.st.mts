const e = process.env;
const tok = ((await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${e.NEXT_PUBLIC_FIREBASE_API_KEY}`, { method: "POST", body: JSON.stringify({ email: e.TEST_USER_EMAIL, password: e.TEST_USER_PASSWORD, returnSecureToken: true }) })).json()) as { idToken: string }).idToken;
const r = await fetch("https://wat--watweb-33601.asia-southeast1.hosted.app/api/admin/temples/HoHAwKSJaMj92jGJxxPX", { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${tok}` }, body: JSON.stringify({ status: process.argv[2] }) });
console.log("set", process.argv[2], "->", r.status);
