import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Pin, Activity, Layers, Plus } from 'lucide-react';
import GlassCard from './GlassCard';

const StatCard = ({ icon: Icon, label, value, delay }) => (
    <GlassCard delay={delay} className="flex flex-col items-center justify-center p-6 bg-white/50 dark:bg-white/5">
        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-3 text-accent-primary">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-3xl font-bold font-brand mb-1 text-slate-800 dark:text-white transition-colors">{value}</h3>
        <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-widest font-semibold transition-colors">{label}</p>
    </GlassCard>
);

const Dashboard = ({ history, stats, onDelete, onCreateNew }) => {
    return (
        <div className="max-w-7xl mx-auto space-y-12 py-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Layers} label="Projects Created" value={stats.totalProjects} delay={0.1} />
                <StatCard icon={Pin} label="Total Pins Used" value={stats.totalPins.toLocaleString()} delay={0.2} />
                <StatCard icon={Activity} label="Threads Spun" value={stats.totalLines.toLocaleString()} delay={0.3} />
            </div>

            {/* Gallery Section */}
            <div>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold font-brand mb-2 text-slate-800 dark:text-white transition-colors">Your Gallery</h2>
                        <p className="text-slate-500 dark:text-white/40 text-sm transition-colors">
                            Manage and revisit your generated masterpieces.
                        </p>
                    </div>
                    <button
                        onClick={onCreateNew}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-all shadow-lg hover:shadow-accent-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="text-center py-20 bg-slate-100 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/5 mx-auto flex items-center justify-center mb-4 transition-colors">
                            <Layers className="w-8 h-8 text-slate-400 dark:text-white/20 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-700 dark:text-white transition-colors">No projects yet</h3>
                        <p className="text-slate-500 dark:text-white/40 max-w-sm mx-auto mb-6 transition-colors">
                            Start generating string art to build your collection.
                        </p>
                        <button
                            onClick={onCreateNew}
                            className="text-accent-primary hover:text-accent-primary/80 font-medium text-sm transition-colors"
                        >
                            Start your first project &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <GlassCard className="group relative overflow-hidden p-0 h-full bg-white/70 dark:bg-black/40">
                                    <div className="aspect-square w-full bg-slate-900/50 relative overflow-hidden">
                                        {/* Image */}
                                        <img
                                            src={item.imageThumbnail}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full backdrop-blur-sm transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <h4 className="font-bold text-lg mb-1 truncate text-slate-800 dark:text-white transition-colors">{item.title}</h4>
                                        <div className="flex gap-4 text-xs text-slate-500 dark:text-white/40 transition-colors">
                                            <span className="flex items-center gap-1">
                                                <Pin className="w-3 h-3" /> {item.nNails} nails
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Activity className="w-3 h-3" /> {item.maxLines} lines
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-400 dark:text-white/20 font-mono transition-colors">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
