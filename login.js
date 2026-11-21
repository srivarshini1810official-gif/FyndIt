
// ==========================================
// FYNDIt - LOGIN USING FIREBASE REST API
// ==========================================

const LOGIN_URL =
    `${FIREBASE_AUTH_URL}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;


// Display login messages
function showLoginMessage(message, isError = true) {

    const messageElement = document.getElementById("loginMessage");

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#B42318" : "#267A45";

}


// Retrieve the customer's Firestore profile
async function getLoginUserProfile(uid, idToken) {

    const response = await fetch(
        `${FIRESTORE_BASE_URL}/users/${uid}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${idToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Unable to retrieve your account profile.");
    }

    const document = await response.json();

    const fields = document.fields || {};

    return {
        userId: uid,
        name: fields.name?.stringValue || "",
        email: fields.email?.stringValue || "",
        role: fields.role?.stringValue || "",
        status: fields.status?.stringValue || ""
    };

}


// Find a safe page to redirect to after login
function getLoginRedirectPage() {

    const requestedPage =
        new URLSearchParams(window.location.search).get("returnUrl");

    const allowedPages = [
        "index.html",
        "products.html",
        "cart.html",
        "checkout.html"
    ];

    if (requestedPage && allowedPages.includes(requestedPage)) {
        return requestedPage;
    }

    return "index.html";

}


// Handle login form submission
document.getElementById("loginForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const loginButton =
            document.getElementById("loginButton");

        loginButton.disabled = true;
        loginButton.textContent = "SIGNING IN...";

        showLoginMessage("Checking your account...", false);

        try {

            // STEP 1: Authenticate using Firebase Authentication REST API
            const authResponse = await fetch(LOGIN_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true
                })

            });

            const authData = await authResponse.json();

            if (!authResponse.ok) {

                const errorCode = authData.error?.message || "";

                if (
                    errorCode === "INVALID_LOGIN_CREDENTIALS" ||
                    errorCode === "EMAIL_NOT_FOUND" ||
                    errorCode === "INVALID_PASSWORD"
                ) {
                    throw new Error("Incorrect email or password.");
                }

                if (errorCode === "USER_DISABLED") {
                    throw new Error("This account has been disabled.");
                }

                throw new Error("Login failed. Please try again.");

            }


            // STEP 2: Retrieve the user's Firestore profile
            const profile = await getLoginUserProfile(
                authData.localId,
                authData.idToken
            );


            // STEP 3: Check account status
            if (profile.status !== "active") {
                throw new Error("Your account is inactive. Please contact the administrator.");
            }

            if (
                profile.role !== "customer" &&
                profile.role !== "admin"
            ) {
                throw new Error("Your account does not have a valid role.");
            }


            // STEP 4: Save the login session
            const session = {

                userId: authData.localId,
                name: profile.name,
                email: profile.email || authData.email,
                role: profile.role,
                idToken: authData.idToken,
                refreshToken: authData.refreshToken,
                expiresIn: authData.expiresIn,
                loginTime: new Date().toISOString()

            };

            localStorage.setItem(
                "fynditSession",
                JSON.stringify(session)
            );


            // STEP 5: Redirect after successful login
            showLoginMessage("Login successful! Redirecting...", false);

            if (profile.role === "admin") {

    window.location.href = "admin.html";

} else {

    window.location.href = getLoginRedirectPage();

}


        } catch (error) {

            console.error("Login error:", error);

            showLoginMessage(error.message);

            loginButton.disabled = false;
            loginButton.textContent = "SIGN IN";

        }

    }
);
