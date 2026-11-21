
// ==========================================
// FYNDIt - CUSTOMER REGISTRATION
// FIREBASE AUTHENTICATION + FIRESTORE REST API
// ==========================================

const REGISTER_URL =
    `${FIREBASE_AUTH_URL}/accounts:signUp?key=${FIREBASE_API_KEY}`;


// Display registration messages
function showRegisterMessage(message, isError = true) {

    const messageElement =
        document.getElementById("registerMessage");

    messageElement.textContent = message;

    messageElement.style.color =
        isError ? "#B42318" : "#267A45";

}


// Convert data into Firestore REST API format
function createFirestoreCustomerData(customer) {

    return {
        fields: {

            userId: {
                stringValue: customer.userId
            },

            name: {
                stringValue: customer.name
            },

            email: {
                stringValue: customer.email
            },

            role: {
                stringValue: "customer"
            },

            status: {
                stringValue: "active"
            },

            phone: {
                stringValue: customer.phone
            },

            address: {
                mapValue: {
                    fields: {

                        street: {
                            stringValue: customer.address.street
                        },

                        city: {
                            stringValue: customer.address.city
                        },

                        state: {
                            stringValue: customer.address.state
                        },

                        pincode: {
                            stringValue: customer.address.pincode
                        }

                    }
                }
            },

            createdAt: {
                stringValue: new Date().toISOString()
            }

        }
    };

}


// Create the customer profile in Firestore
async function saveCustomerProfile(customer, idToken) {

    const profileURL =
        `${FIRESTORE_BASE_URL}/users?documentId=${encodeURIComponent(customer.userId)}`;

    const response = await fetch(profileURL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
        },

        body: JSON.stringify(
            createFirestoreCustomerData(customer)
        )

    });

    const result = await response.json();

    if (!response.ok) {

        console.error("Firestore profile error:", result);

        throw new Error(
            "Your login account was created, but your customer profile could not be saved. Please contact the administrator."
        );

    }

    return result;

}


// Handle customer registration
document.getElementById("registerForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const phone =
            document.getElementById("registerPhone").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const street =
            document.getElementById("registerAddress").value.trim();

        const city =
            document.getElementById("registerCity").value.trim();

        const state =
            document.getElementById("registerState").value.trim();

        const pincode =
            document.getElementById("registerPincode").value.trim();

        const registerButton =
            document.getElementById("registerButton");


        // STEP 1: Validate password confirmation
        if (password !== confirmPassword) {

            showRegisterMessage("Passwords do not match.");

            return;

        }


        // STEP 2: Validate phone number
        if (!/^[0-9]{10}$/.test(phone)) {

            showRegisterMessage(
                "Please enter a valid 10-digit phone number."
            );

            return;

        }


        // STEP 3: Validate PIN code
        if (!/^[0-9]{6}$/.test(pincode)) {

            showRegisterMessage(
                "Please enter a valid 6-digit PIN code."
            );

            return;

        }


        registerButton.disabled = true;
        registerButton.textContent = "CREATING ACCOUNT...";

        showRegisterMessage("Creating your FyndIt account...", false);


        try {

            // STEP 4: Create account in Firebase Authentication
            const authResponse = await fetch(REGISTER_URL, {

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

                const errorCode =
                    authData.error?.message || "";

                if (errorCode === "EMAIL_EXISTS") {

                    throw new Error(
                        "This email is already registered. Please sign in."
                    );

                }

                if (errorCode === "INVALID_EMAIL") {

                    throw new Error(
                        "Please enter a valid email address."
                    );

                }

                if (errorCode === "WEAK_PASSWORD") {

                    throw new Error(
                        "Please choose a stronger password with at least 6 characters."
                    );

                }

                throw new Error(
                    "Unable to create your account. Please try again."
                );

            }


            // STEP 5: Prepare customer profile
            const customer = {

                userId: authData.localId,

                name: name,

                email: email,

                phone: phone,

                address: {

                    street: street,

                    city: city,

                    state: state,

                    pincode: pincode

                }

            };


            // STEP 6: Save customer profile in Firestore
            await saveCustomerProfile(
                customer,
                authData.idToken
            );


            // STEP 7: Create customer login session
            const session = {

                userId: authData.localId,

                name: name,

                email: email,

                role: "customer",

                idToken: authData.idToken,

                refreshToken: authData.refreshToken,

                expiresIn: authData.expiresIn,

                loginTime: new Date().toISOString()

            };


            localStorage.setItem(
                "fynditSession",
                JSON.stringify(session)
            );


            // STEP 8: Redirect after successful registration
            showRegisterMessage(
                "Your account has been created successfully! Redirecting...",
                false
            );

            window.location.href = "index.html";


        } catch (error) {

            console.error("Registration error:", error);

            showRegisterMessage(error.message);

            registerButton.disabled = false;

            registerButton.textContent = "CREATE ACCOUNT";

        }

    }
);
