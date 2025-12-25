// Admin Module - Data Upload and Management
class AdminService {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.logger = window.logger;
        this.encryptionService = window.encryptionService;
    }

    /**
     * Upload a single POI
     * @param {object} poi - POI data
     */
    async uploadPOI(poi) {
        try {
            // Validate POI data
            if (!this.validatePOI(poi)) {
                throw new Error('Invalid POI data');
            }

            // Encrypt POI data
            const encryptedData = this.encryptionService.encryptPOI(poi);

            // Store in Firestore
            const docRef = await this.db.collection('encrypted_pois').add({
                encryptedData: encryptedData,
                uploadedBy: this.auth.currentUser.uid,
                uploadedByEmail: this.auth.currentUser.email,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Store approximate location for indexing (not exact for privacy)
                approximateRegion: this.getApproximateRegion(poi.latitude, poi.longitude)
            });

            await this.logger.success('POI uploaded successfully', {
                poiId: docRef.id,
                name: poi.name
            });

            return {
                success: true,
                id: docRef.id,
                message: 'POI uploaded successfully!'
            };
        } catch (error) {
            await this.logger.error('POI upload failed', { error: error.message });
            return {
                success: false,
                error: error.message,
                message: 'Failed to upload POI: ' + error.message
            };
        }
    }

    /**
     * Upload multiple POIs from CSV
     * @param {string} csvContent - CSV file content
     */
    async uploadPOIsFromCSV(csvContent) {
        try {
            const pois = this.parseCSV(csvContent);
            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            for (const poi of pois) {
                const result = await this.uploadPOI(poi);
                if (result.success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({ poi: poi.name, error: result.error });
                }
            }

            await this.logger.success('Bulk POI upload completed', {
                success: results.success,
                failed: results.failed
            });

            return {
                success: true,
                results: results,
                message: `Uploaded ${results.success} POIs successfully. ${results.failed} failed.`
            };
        } catch (error) {
            await this.logger.error('Bulk POI upload failed', { error: error.message });
            return {
                success: false,
                error: error.message,
                message: 'Failed to parse CSV: ' + error.message
            };
        }
    }

    /**
     * Parse CSV content
     * @param {string} csvContent - CSV file content
     */
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const pois = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',').map(part => part.trim());

            if (parts.length >= 3) {
                pois.push({
                    name: parts[0],
                    latitude: parts[1],
                    longitude: parts[2],
                    description: parts[3] || ''
                });
            }
        }

        return pois;
    }

    /**
     * Validate POI data
     * @param {object} poi - POI data
     */
    validatePOI(poi) {
        if (!poi.name || poi.name.trim() === '') {
            throw new Error('POI name is required');
        }

        const lat = parseFloat(poi.latitude);
        const lng = parseFloat(poi.longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new Error('Invalid latitude. Must be between -90 and 90');
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            throw new Error('Invalid longitude. Must be between -180 and 180');
        }

        return true;
    }

    /**
     * Get approximate region for indexing (privacy-preserving)
     * Rounds coordinates to 1 decimal place (~11km precision)
     */
    getApproximateRegion(lat, lng) {
        return {
            lat: Math.round(parseFloat(lat) * 10) / 10,
            lng: Math.round(parseFloat(lng) * 10) / 10
        };
    }

    /**
     * Get all uploaded POIs
     */
    async getAllPOIs() {
        try {
            const snapshot = await this.db.collection('encrypted_pois')
                .where('uploadedBy', '==', this.auth.currentUser.uid)
                .orderBy('uploadedAt', 'desc')
                .get();

            const pois = [];
            snapshot.forEach(doc => {
                pois.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                pois: pois
            };
        } catch (error) {
            await this.logger.error('Failed to retrieve POIs', { error: error.message });
            return {
                success: false,
                error: error.message,
                pois: []
            };
        }
    }

    /**
     * Delete a POI
     * @param {string} poiId - POI document ID
     */
    async deletePOI(poiId) {
        try {
            await this.db.collection('encrypted_pois').doc(poiId).delete();

            await this.logger.success('POI deleted successfully', { poiId: poiId });

            return {
                success: true,
                message: 'POI deleted successfully!'
            };
        } catch (error) {
            await this.logger.error('POI deletion failed', {
                poiId: poiId,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: 'Failed to delete POI'
            };
        }
    }

    /**
     * Update a POI
     * @param {string} poiId - POI document ID
     * @param {object} updatedPOI - Updated POI data
     */
    async updatePOI(poiId, updatedPOI) {
        try {
            // Validate updated data
            if (!this.validatePOI(updatedPOI)) {
                throw new Error('Invalid POI data');
            }

            // Encrypt updated data
            const encryptedData = this.encryptionService.encryptPOI(updatedPOI);

            // Update in Firestore
            await this.db.collection('encrypted_pois').doc(poiId).update({
                encryptedData: encryptedData,
                approximateRegion: this.getApproximateRegion(
                    updatedPOI.latitude,
                    updatedPOI.longitude
                ),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.logger.success('POI updated successfully', {
                poiId: poiId,
                name: updatedPOI.name
            });

            return {
                success: true,
                message: 'POI updated successfully!'
            };
        } catch (error) {
            await this.logger.error('POI update failed', {
                poiId: poiId,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: 'Failed to update POI'
            };
        }
    }
}

// Create global admin service instance
window.adminService = new AdminService();
console.log('Admin service initialized');
