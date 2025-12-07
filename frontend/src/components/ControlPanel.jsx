import React, { useState } from 'react';
import { Upload, Sliders, AlertCircle, Sparkles, Crop as CropIcon } from 'lucide-react';
import GlassCard from './GlassCard';
import { AnimatePresence, motion } from 'framer-motion';
import ImageCropper from './ImageCropper';

const ControlPanel = ({
    file,
    setFile,
    nNails,
    setNNails,
    maxLines,
    setMaxLines,
    handleGenerate,
    loading,
    error
}) => {
    const [showCropper, setShowCropper] = useState(false);
    const [cropperSrc, setCropperSrc] = useState(null);

    const onFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCropperSrc(reader.result.toString() || '');
                setShowCropper(true);
            });
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleCropComplete = (croppedBlob) => {
        // Convert Blob to File to match expected prop type (if used elsewhere as file)
        const croppedFile = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
        setFile(croppedFile);
        setShowCropper(false);
    };

    const handleReCrop = (e) => {
        e.stopPropagation(); // Prevent file input trigger
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCropperSrc(reader.result.toString() || '');
                setShowCropper(true);
            });
            reader.readAsDataURL(file);
        }
    }

    return (
        <GlassCard className="h-full flex flex-col gap-6 bg-white/70 dark:bg-black/40">
            {showCropper && cropperSrc && (
                <ImageCropper
                    imageSrc={cropperSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                />
            )}

            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white transition-colors">
                    <Upload className="w-5 h-5 text-accent-primary" />
                    Input Image
                </h2>
                <div className={`
                    flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed
                    transition-all group relative overflow-hidden
                    ${file
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer'}
                `}>
                    {!file && (
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            accept="image/*"
                            onChange={onFileSelect}
                        />
                    )}

                    {file ? (
                        <div className="absolute inset-0 z-10">
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="w-full h-full object-cover opacity-60 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                                <button
                                    onClick={handleReCrop}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white font-medium flex items-center gap-2 transition-colors border border-white/10"
                                >
                                    <CropIcon className="w-4 h-4" />
                                    Adjust Crop
                                </button>
                                <label className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 rounded-lg text-white font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-accent-primary/20">
                                    <Upload className="w-4 h-4" />
                                    Change Image
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onFileSelect}
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white/70 transition-colors p-6 text-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium">Click or Drag & Drop</p>
                            <p className="text-xs opacity-70">Supports JPG, PNG</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white transition-colors">
                    <Sliders className="w-5 h-5 text-accent-secondary" />
                    Parameters
                </h2>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-slate-600 dark:text-white/70 transition-colors">Nails Count</label>
                        <span className="font-mono text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded text-xs">{nNails}</span>
                    </div>
                    <input
                        type="range"
                        min="100"
                        max="360"
                        value={nNails}
                        onChange={(e) => setNNails(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <label className="text-slate-600 dark:text-white/70 transition-colors">Max Lines</label>
                        <span className="font-mono text-accent-secondary bg-accent-secondary/10 px-2 py-0.5 rounded text-xs">{maxLines}</span>
                    </div>
                    <input
                        type="range"
                        min="1000"
                        max="8000"
                        step="100"
                        value={maxLines}
                        onChange={(e) => setMaxLines(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-secondary"
                    />
                </div>
            </div>

            <div className="mt-auto pt-4">
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm"
                        >
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleGenerate}
                    disabled={!file || loading}
                    className={`
                        w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                        ${!file || loading
                            ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 cursor-not-allowed'
                            : 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 hover:scale-[1.02] active:scale-[0.98]'}`
                    }
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate Art
                        </>
                    )}
                </button>
            </div>
        </GlassCard>
    );
};

export default ControlPanel;
