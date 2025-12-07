import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X, ZoomIn, RotateCw } from 'lucide-react'
import getCroppedImg from '../utils/canvasUtils'

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [rotation, setRotation] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    const onCropChange = (crop) => {
        setCrop(crop)
    }

    const onRotationChange = (rotation) => {
        setRotation(rotation)
    }

    const onZoomChange = (zoom) => {
        setZoom(zoom)
    }

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            )
            onCropComplete(croppedImage)
        } catch (e) {
            console.error(e)
        }
    }, [imageSrc, croppedAreaPixels, rotation, onCropComplete])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-y-auto shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Adjust Image</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 dark:text-white/70" />
                    </button>
                </div>

                <div className="relative h-[400px] w-full bg-slate-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        rotation={rotation}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onRotationChange={onRotationChange}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <ZoomIn className="w-5 h-5 text-slate-500 dark:text-white/70" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <RotateCw className="w-5 h-5 text-slate-500 dark:text-white/70" />
                            <input
                                type="range"
                                value={rotation}
                                min={0}
                                max={360}
                                step={1}
                                aria-labelledby="Rotation"
                                onChange={(e) => setRotation(e.target.value)}
                                className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-white/70 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={showCroppedImage}
                            className="px-6 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium shadow-lg shadow-accent-primary/20 transition-all flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Confirm Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImageCropper
