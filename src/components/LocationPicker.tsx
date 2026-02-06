import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import exifr from 'exifr' // You'll need to install this: npm i exifr

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationPickerProps {
    value: string // "lat, lon"
    onChange: (val: string) => void
    imageData?: string // Base64 image to extract EXIF from
    disabled?: boolean
}

function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            onLocationSelected(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export default function LocationPicker({ value, onChange, imageData, disabled }: LocationPickerProps) {
    const [showMap, setShowMap] = useState(false)
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null)
    const [loading, setLoading] = useState(false)

    // Parse value string to coords
    useEffect(() => {
        if (value) {
            const [lat, lng] = value.split(',').map(s => parseFloat(s.trim()))
            if (!isNaN(lat) && !isNaN(lng)) {
                setCoords({ lat, lng })
            }
        }
    }, [value])

    // Auto-extract EXIF on mount if imageData changes and no value yet
    useEffect(() => {
        if (imageData && !value && !coords) {
            extractGPS(imageData)
        }
    }, [imageData])

    const extractGPS = async (img: string) => {
        try {
            setLoading(true)
            const gps = await exifr.gps(img)
            if (gps && gps.latitude && gps.longitude) {
                const loc = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`
                onChange(loc)
            }
        } catch (e) {
            console.warn('No GPS found in image')
        } finally {
            setLoading(false)
        }
    }

    const getCurrentLocation = () => {
        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
                onChange(loc)
                setLoading(false)
            },
            () => {
                alert('Could not get location')
                setLoading(false)
            }
        )
    }

    const handleMapClick = (lat: number, lng: number) => {
        onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        // optional: close map or keep open?
    }

    return (
        <div className="location-picker">
            <div className="input-row">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Lat, Lon"
                    disabled={disabled}
                />
                <button className="icon-btn" onClick={getCurrentLocation} disabled={disabled || loading} title="Use Current Location">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                </button>
                <button className="icon-btn" onClick={() => setShowMap(!showMap)} disabled={disabled} title="Pick on Map">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>
                </button>
            </div>

            {loading && <div className="loc-loading">Finding location...</div>}

            {showMap && (
                <div className="map-modal">
                    <div className="map-container">
                        <button className="close-map" onClick={() => setShowMap(false)}>Close Map</button>
                        <MapContainer
                            center={coords || { lat: 0, lng: 0 }}
                            zoom={coords ? 13 : 2}
                            style={{ height: '300px', width: '100%', borderRadius: '12px' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            {coords && <Marker position={coords} />}
                            <MapEvents onLocationSelected={handleMapClick} />
                        </MapContainer>
                    </div>
                </div>
            )}

            <style>{`
                .location-picker { width: 100%; display: flex; flex-direction: column; gap: 8px; }
                .input-row { display: flex; gap: 8px; width: 100%; }
                .input-row input { flex: 1; }
                .icon-btn { 
                    padding: 0 12px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); 
                    border-radius: 12px; color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .icon-btn:hover { background: rgba(255,255,255,0.2); }
                .loc-loading { font-size: 12px; color: var(--accent); }
                
                .map-modal { margin-top: 8px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: #fff; }
                .map-container { position: relative; }
                .close-map { 
                    position: absolute; top: 10px; right: 10px; z-index: 1000; 
                    background: #fff; color: #000; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    )
}
