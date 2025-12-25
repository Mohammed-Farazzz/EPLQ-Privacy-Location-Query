// Encryption/Decryption Utilities using CryptoJS
class EncryptionService {
    constructor() {
        // Default encryption key (in production, this should be user-specific)
        this.defaultKey = 'EPLQ-2024-Privacy-Key';
    }

    /**
     * Generate a key from user credentials
     * @param {string} email - User email
     * @param {string} password - User password
     */
    generateKey(email, password) {
        const combined = `${email}:${password}`;
        return CryptoJS.SHA256(combined).toString();
    }

    /**
     * Encrypt data using AES-256
     * @param {object} data - Data to encrypt
     * @param {string} key - Encryption key (optional)
     */
    encrypt(data, key = null) {
        try {
            const encryptionKey = key || this.defaultKey;
            const jsonString = JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonString, encryptionKey).toString();

            logger.info('Data encrypted successfully', {
                dataSize: jsonString.length,
                encryptedSize: encrypted.length
            });

            return encrypted;
        } catch (error) {
            logger.error('Encryption failed', { error: error.message });
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    /**
     * Decrypt data using AES-256
     * @param {string} encryptedData - Encrypted data string
     * @param {string} key - Decryption key (optional)
     */
    decrypt(encryptedData, key = null) {
        try {
            const decryptionKey = key || this.defaultKey;
            const decrypted = CryptoJS.AES.decrypt(encryptedData, decryptionKey);
            const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

            if (!jsonString) {
                throw new Error('Decryption failed - invalid key or corrupted data');
            }

            const data = JSON.parse(jsonString);

            logger.info('Data decrypted successfully');

            return data;
        } catch (error) {
            logger.error('Decryption failed', { error: error.message });
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    /**
     * Encrypt POI (Point of Interest) data
     * @param {object} poi - POI object with name, lat, lng, description
     */
    encryptPOI(poi) {
        const poiData = {
            name: poi.name,
            latitude: parseFloat(poi.latitude),
            longitude: parseFloat(poi.longitude),
            description: poi.description || '',
            timestamp: new Date().toISOString()
        };

        return this.encrypt(poiData);
    }

    /**
     * Decrypt POI data
     * @param {string} encryptedPOI - Encrypted POI string
     */
    decryptPOI(encryptedPOI) {
        return this.decrypt(encryptedPOI);
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Check if a point is within a circular range
     * @param {number} centerLat - Center latitude
     * @param {number} centerLon - Center longitude
     * @param {number} pointLat - Point latitude
     * @param {number} pointLon - Point longitude
     * @param {number} radius - Radius in kilometers
     */
    isWithinRange(centerLat, centerLon, pointLat, pointLon, radius) {
        const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon);
        return distance <= radius;
    }

    /**
     * Inner product range predicate for privacy-preserving spatial queries
     * This is a simplified version - in production, use more sophisticated techniques
     */
    innerProductRangePredicate(queryVector, dataVector, threshold) {
        let innerProduct = 0;
        for (let i = 0; i < queryVector.length; i++) {
            innerProduct += queryVector[i] * dataVector[i];
        }
        return innerProduct <= threshold;
    }
}

// Create global encryption service instance
window.encryptionService = new EncryptionService();
console.log('Encryption service initialized');
