// Authentication Service
class AuthService {
    constructor() {
        this.auth = window.auth;
        this.db = window.db;
        this.logger = window.logger;
    }

    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} role - User role (admin or user)
     */
    async register(email, password, role = 'user') {
        try {
            // Create user with email and password
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store user data in Firestore
            await this.db.collection('users').doc(user.uid).set({
                email: email,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Log the registration
            await this.logger.success('User registered successfully', {
                email: email,
                role: role
            });

            return {
                success: true,
                user: user,
                message: 'Registration successful!'
            };
        } catch (error) {
            await this.logger.error('Registration failed', {
                email: email,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update last login time
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Get user role
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            await this.logger.success('User logged in successfully', {
                email: email,
                role: userData.role
            });

            return {
                success: true,
                user: user,
                role: userData.role,
                message: 'Login successful!'
            };
        } catch (error) {
            await this.logger.error('Login failed', {
                email: email,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            const user = this.auth.currentUser;
            await this.logger.info('User logged out', {
                email: user ? user.email : 'unknown'
            });

            await this.auth.signOut();

            return {
                success: true,
                message: 'Logout successful!'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Logout failed'
            };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.auth.currentUser !== null;
    }

    /**
     * Get user role
     */
    async getUserRole() {
        try {
            const user = this.auth.currentUser;
            if (!user) return null;

            const userDoc = await this.db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            return userData ? userData.role : null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }

    /**
     * Check if user is admin
     */
    async isAdmin() {
        const role = await this.getUserRole();
        return role === 'admin';
    }

    /**
     * Reset password
     * @param {string} email - User email
     */
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);

            await this.logger.info('Password reset email sent', { email: email });

            return {
                success: true,
                message: 'Password reset email sent! Check your inbox.'
            };
        } catch (error) {
            await this.logger.error('Password reset failed', {
                email: email,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * Get user-friendly error messages
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please login instead.',
            'auth/invalid-email': 'Invalid email address format.',
            'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
            'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };

        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    /**
     * Auth state observer
     */
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
}

// Create global auth service instance
window.authService = new AuthService();
console.log('Auth service initialized');
