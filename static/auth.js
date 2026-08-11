// ---------------------------------------------------------------------------
// Supabase client setup
// ---------------------------------------------------------------------------
// createClient expects the project's base URL, not a REST sub-path -
// the Auth API lives under /auth/v1, so appending /rest/v1/ here breaks
// every auth.* call.
const supabaseUrl = 'https://twymrdyknhrijlzwpvpt.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3eW1yZHlrbmhyaWpsendwdnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDAwODEsImV4cCI6MjA5ODkxNjA4MX0.VSbpFdtxVzZ5skJ3E5cs1TdHo1FtLVhULddlxiEXhP4";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// DOM references (auth.html)
// ---------------------------------------------------------------------------
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');
const loginSubmitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupMessage = document.getElementById('signup-message');
const signupSubmitBtn = signupForm ? signupForm.querySelector('button[type="submit"]') : null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6; // Supabase's default minimum password length

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

// Show an inline message inside a form's message box (error or success).
function showMessage(el, text, type = 'error') {
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden', 'text-error', 'text-on-tertiary-container');
    el.classList.add(type === 'error' ? 'text-error' : 'text-on-tertiary-container');
}

function clearMessage(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
}

// Disable a submit button and swap its label while a request is in flight,
// so a slow network can't let the user fire off duplicate requests.
function setButtonLoading(button, isLoading, loadingText) {
    if (!button) return;
    if (isLoading) {
        button.dataset.originalContent = button.innerHTML;
        button.disabled = true;
        button.classList.add('opacity-70', 'cursor-not-allowed');
        button.textContent = loadingText;
    } else {
        button.disabled = false;
        button.classList.remove('opacity-70', 'cursor-not-allowed');
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
        }
    }
}

// Map raw Supabase/network errors to copy a non-technical user can act on.
function getFriendlyErrorMessage(error) {
    if (!error) return 'Something went wrong. Please try again.';

    const msg = (error.message || '').toLowerCase();

    if (msg.includes('invalid login credentials')) {
        return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
        return 'Please confirm your email address before logging in - check your inbox for the confirmation link.';
    }
    if (msg.includes('already registered')) {
        return 'An account with this email already exists. Try logging in instead.';
    }
    if (msg.includes('password should be at least')) {
        return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }
    if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
        return 'Network error - please check your connection and try again.';
    }

    return error.message || 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage(loginMessage);

        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        if (!email || !password) {
            showMessage(loginMessage, 'Please enter both your email and password.');
            return;
        }
        if (!EMAIL_REGEX.test(email)) {
            showMessage(loginMessage, 'Please enter a valid email address.');
            return;
        }

        setButtonLoading(loginSubmitBtn, true, 'Logging in...');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showMessage(loginMessage, getFriendlyErrorMessage(error));
                return;
            }
            if (!data || !data.session) {
                showMessage(loginMessage, 'Unable to sign in right now. Please try again.');
                return;
            }

            showMessage(loginMessage, 'Login successful! Redirecting...', 'success');
            window.location.href = '/';
        } catch (err) {
            // Network failure, blocked request, etc. - Supabase never returned.
            console.error('Login error:', err);
            showMessage(loginMessage, getFriendlyErrorMessage(err));
        } finally {
            setButtonLoading(loginSubmitBtn, false);
        }
    });
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------
if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage(signupMessage);

        const fullName = signupNameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value;

        if (!fullName || !email || !password) {
            showMessage(signupMessage, 'Please fill in your name, email, and password.');
            return;
        }
        if (!EMAIL_REGEX.test(email)) {
            showMessage(signupMessage, 'Please enter a valid email address.');
            return;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            showMessage(signupMessage, `Your password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
            return;
        }

        setButtonLoading(signupSubmitBtn, true, 'Creating account...');

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            });

            if (error) {
                showMessage(signupMessage, getFriendlyErrorMessage(error));
                return;
            }

            // Supabase returns a "shell" user with an empty identities array
            // when the email is already registered - it does not error here.
            if (data && data.user && data.user.identities && data.user.identities.length === 0) {
                showMessage(signupMessage, 'An account with this email already exists. Try logging in instead.');
                return;
            }

            if (data && data.session) {
                // Email confirmation is off for this project, so the user is
                // already logged in - send them straight to the dashboard.
                showMessage(signupMessage, 'Account created! Redirecting...', 'success');
                window.location.href = '/';
                return;
            }

            // Email confirmation is required before the account can log in.
            showMessage(signupMessage, 'Account created! Please check your email to confirm your address before logging in.', 'success');
            signupForm.reset();
            switchTab('login');
        } catch (err) {
            console.error('Sign up error:', err);
            showMessage(signupMessage, getFriendlyErrorMessage(err));
        } finally {
            setButtonLoading(signupSubmitBtn, false);
        }
    });
}

// ---------------------------------------------------------------------------
// Skip the auth page entirely if the user already has a valid session.
// ---------------------------------------------------------------------------
(async function redirectIfAlreadyLoggedIn() {
    try {
        const { data } = await supabase.auth.getSession();
        if (data && data.session) {
            window.location.href = '/';
        }
    } catch (err) {
        console.error('Session check failed:', err);
    }
})();
