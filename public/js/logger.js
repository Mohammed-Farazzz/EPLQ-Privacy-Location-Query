// Logging System
class Logger {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
    }

    // Log levels
    static LEVELS = {
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        SUCCESS: 'SUCCESS'
    };

    /**
     * Log an action to Firestore
     * @param {string} action - The action being logged
     * @param {string} level - Log level (INFO, WARNING, ERROR, SUCCESS)
     * @param {object} metadata - Additional metadata
     */
    async log(action, level = Logger.LEVELS.INFO, metadata = {}) {
        try {
            const user = this.auth.currentUser;

            const logEntry = {
                userId: user ? user.uid : 'anonymous',
                userEmail: user ? user.email : 'anonymous',
                action: action,
                level: level,
                metadata: metadata,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // Log to Firestore
            await this.db.collection('logs').add(logEntry);

            // Also log to console for development
            const consoleMethod = level === Logger.LEVELS.ERROR ? 'error' :
                level === Logger.LEVELS.WARNING ? 'warn' : 'log';
            console[consoleMethod](`[${level}] ${action}`, metadata);

            return true;
        } catch (error) {
            console.error('Failed to log action:', error);
            return false;
        }
    }

    // Convenience methods
    async info(action, metadata = {}) {
        return this.log(action, Logger.LEVELS.INFO, metadata);
    }

    async warning(action, metadata = {}) {
        return this.log(action, Logger.LEVELS.WARNING, metadata);
    }

    async error(action, metadata = {}) {
        return this.log(action, Logger.LEVELS.ERROR, metadata);
    }

    async success(action, metadata = {}) {
        return this.log(action, Logger.LEVELS.SUCCESS, metadata);
    }

    /**
     * Get logs for current user
     * @param {number} limit - Number of logs to retrieve
     */
    async getUserLogs(limit = 50) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('No user logged in');
            }

            const logsSnapshot = await this.db.collection('logs')
                .where('userId', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() });
            });

            return logs;
        } catch (error) {
            console.error('Failed to retrieve logs:', error);
            return [];
        }
    }
}

// Create global logger instance
window.logger = new Logger();
console.log('Logger initialized');
