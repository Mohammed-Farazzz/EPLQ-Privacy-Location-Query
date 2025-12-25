// User Module - Search and Decrypt POIs
class UserService {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        this.logger = window.logger;
        this.encryptionService = window.encryptionService;
    }

    /**
     * Search POIs within a radius
     * @param {number} latitude - Center latitude
     * @param {number} longitude - Center longitude
     * @param {number} radius - Search radius in kilometers
     */
    async searchPOIs(latitude, longitude, radius) {
        try {
            // Validate inputs
            if (isNaN(latitude) || latitude < -90 || latitude > 90) {
                throw new Error('Invalid latitude');
            }
            if (isNaN(longitude) || longitude < -180 || longitude > 180) {
                throw new Error('Invalid longitude');
            }
            if (isNaN(radius) || radius <= 0) {
                throw new Error('Invalid radius');
            }

            await this.logger.info('POI search initiated', {
                latitude,
                longitude,
                radius
            });

            // Get approximate region for initial filtering
            const approximateRegion = this.getSearchRegion(latitude, longitude, radius);

            // Query Firestore for POIs in approximate region
            // In production, implement more sophisticated spatial indexing
            const snapshot = await this.db.collection('encrypted_pois').get();

            const results = [];
            let decryptedCount = 0;
            let withinRangeCount = 0;

            // Decrypt and filter POIs
            for (const doc of snapshot.docs) {
                try {
                    const data = doc.data();

                    // Decrypt POI data
                    const decryptedPOI = this.encryptionService.decryptPOI(data.encryptedData);
                    decryptedCount++;

                    // Check if within range
                    const isInRange = this.encryptionService.isWithinRange(
                        latitude,
                        longitude,
                        decryptedPOI.latitude,
                        decryptedPOI.longitude,
                        radius
                    );

                    if (isInRange) {
                        const distance = this.encryptionService.calculateDistance(
                            latitude,
                            longitude,
                            decryptedPOI.latitude,
                            decryptedPOI.longitude
                        );

                        results.push({
                            id: doc.id,
                            ...decryptedPOI,
                            distance: distance,
                            uploadedBy: data.uploadedByEmail,
                            uploadedAt: data.uploadedAt
                        });

                        withinRangeCount++;
                    }
                } catch (error) {
                    // Skip POIs that fail to decrypt
                    console.warn('Failed to decrypt POI:', doc.id, error);
                }
            }

            // Sort by distance
            results.sort((a, b) => a.distance - b.distance);

            await this.logger.success('POI search completed', {
                totalPOIs: snapshot.size,
                decrypted: decryptedCount,
                withinRange: withinRangeCount,
                latitude,
                longitude,
                radius
            });

            return {
                success: true,
                results: results,
                stats: {
                    totalPOIs: snapshot.size,
                    decrypted: decryptedCount,
                    withinRange: withinRangeCount
                },
                message: `Found ${withinRangeCount} POI(s) within ${radius}km`
            };
        } catch (error) {
            await this.logger.error('POI search failed', {
                error: error.message,
                latitude,
                longitude,
                radius
            });

            return {
                success: false,
                error: error.message,
                results: [],
                message: 'Search failed: ' + error.message
            };
        }
    }

    /**
     * Get search region for initial filtering
     * @param {number} lat - Center latitude
     * @param {number} lng - Center longitude
     * @param {number} radius - Radius in kilometers
     */
    getSearchRegion(lat, lng, radius) {
        // Approximate degrees per km (varies by latitude)
        const latDegreesPerKm = 1 / 111;
        const lngDegreesPerKm = 1 / (111 * Math.cos(lat * Math.PI / 180));

        return {
            minLat: lat - (radius * latDegreesPerKm),
            maxLat: lat + (radius * latDegreesPerKm),
            minLng: lng - (radius * lngDegreesPerKm),
            maxLng: lng + (radius * lngDegreesPerKm)
        };
    }

    /**
     * Get user's current location
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(new Error('Unable to retrieve your location: ' + error.message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * Search POIs near current location
     * @param {number} radius - Search radius in kilometers
     */
    async searchNearMe(radius) {
        try {
            const location = await this.getCurrentLocation();

            await this.logger.info('Searching near current location', {
                latitude: location.latitude,
                longitude: location.longitude,
                radius
            });

            return await this.searchPOIs(location.latitude, location.longitude, radius);
        } catch (error) {
            await this.logger.error('Near me search failed', { error: error.message });

            return {
                success: false,
                error: error.message,
                results: [],
                message: 'Failed to get current location: ' + error.message
            };
        }
    }

    /**
     * Get POI details by ID
     * @param {string} poiId - POI document ID
     */
    async getPOIDetails(poiId) {
        try {
            const doc = await this.db.collection('encrypted_pois').doc(poiId).get();

            if (!doc.exists) {
                throw new Error('POI not found');
            }

            const data = doc.data();
            const decryptedPOI = this.encryptionService.decryptPOI(data.encryptedData);

            return {
                success: true,
                poi: {
                    id: doc.id,
                    ...decryptedPOI,
                    uploadedBy: data.uploadedByEmail,
                    uploadedAt: data.uploadedAt
                }
            };
        } catch (error) {
            await this.logger.error('Failed to get POI details', {
                poiId,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                message: 'Failed to retrieve POI details'
            };
        }
    }

    /**
     * Format distance for display
     * @param {number} distance - Distance in kilometers
     */
    formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        } else {
            return `${distance.toFixed(2)}km`;
        }
    }

    /**
     * Get search history for current user
     */
    async getSearchHistory(limit = 10) {
        try {
            const logs = await this.logger.getUserLogs(limit);

            // Filter for search actions
            const searchLogs = logs.filter(log =>
                log.action.includes('POI search')
            );

            return {
                success: true,
                history: searchLogs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                history: []
            };
        }
    }
}

// Create global user service instance
window.userService = new UserService();
console.log('User service initialized');
