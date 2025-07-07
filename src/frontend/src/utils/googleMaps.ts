interface GoogleMapsLoader {
    isLoaded: boolean;
    isLoading: boolean;
    loadPromise: Promise<void> | null;
}

class GoogleMapsLoaderService {
    private loader: GoogleMapsLoader = {
        isLoaded: false,
        isLoading: false,
        loadPromise: null,
    };

    async loadGoogleMaps(apiKey: string): Promise<void> {
        // If already loaded, return immediately
        if (this.loader.isLoaded && window.google && window.google.maps) {
            return Promise.resolve();
        }

        // If currently loading, return the existing promise
        if (this.loader.isLoading && this.loader.loadPromise) {
            return this.loader.loadPromise;
        }

        // Check if script already exists in the DOM
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            // Wait for existing script to load
            return new Promise((resolve, reject) => {
                if (window.google && window.google.maps) {
                    this.loader.isLoaded = true;
                    resolve();
                } else {
                    existingScript.addEventListener('load', () => {
                        this.loader.isLoaded = true;
                        resolve();
                    });
                    existingScript.addEventListener('error', reject);
                }
            });
        }

        // Start loading
        this.loader.isLoading = true;
        this.loader.loadPromise = new Promise((resolve, reject) => {
            if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
                reject(new Error('Google Maps API key not configured'));
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.loader.isLoaded = true;
                this.loader.isLoading = false;
                resolve();
            };

            script.onerror = () => {
                this.loader.isLoading = false;
                reject(new Error('Failed to load Google Maps API'));
            };

            document.head.appendChild(script);
        });

        return this.loader.loadPromise;
    }

    isGoogleMapsLoaded(): boolean {
        return Boolean(this.loader.isLoaded && window.google && window.google.maps);
    }
}

export const googleMapsLoader = new GoogleMapsLoaderService(); 