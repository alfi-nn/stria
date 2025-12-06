import { useEffect, useRef, useState } from 'react'


const StringArtCanvas = ({ sequence, nNails, width = 800, height = 800, theme = 'dark' }) => {
    const canvasRef = useRef(null)
    const [progress, setProgress] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [speed, setSpeed] = useState(10)
    const [showNumbers, setShowNumbers] = useState(false)
    const requestRef = useRef()
    const currentIndexRef = useRef(0)
    const ctxRef = useRef(null)

    // Colors
    const colors = {
        light: { bg: '#ffffff', nail: '#dddddd', thread: 'rgba(0, 0, 0, 0.4)', text: '#666666' },
        dark: { bg: '#1a1a1a', nail: '#333333', thread: 'rgba(255, 255, 255, 0.4)', text: '#888888' }
    }
    const currentTheme = colors[theme === 'light' ? 'light' : 'dark']

    // Setup Canvas and Initialization
    useEffect(() => {
        const canvas = canvasRef.current
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        ctxRef.current = ctx

        // Reset if sequence changes significantly (new generation)
        currentIndexRef.current = 0
        setProgress(0)
        setIsPlaying(true)

        // Initial Draw (Background + Nails)
        drawStaticElements(ctx)

    }, [sequence, nNails, width, height, theme])

    const drawStaticElements = (ctx) => {
        const w = width
        const h = height
        const center = w / 2
        const radius = (w / 2) - 30

        // Background
        ctx.fillStyle = currentTheme.bg
        ctx.fillRect(0, 0, w, h)

        // Nails
        for (let i = 0; i < nNails; i++) {
            const angle = (2 * Math.PI * i) / nNails
            const x = center + radius * Math.cos(angle)
            const y = center + radius * Math.sin(angle)

            ctx.beginPath()
            ctx.arc(x, y, 2, 0, 2 * Math.PI)
            ctx.fillStyle = currentTheme.nail
            ctx.fill()
        }
    }

    // Animation Loop
    useEffect(() => {
        const animate = () => {
            if (!isPlaying || currentIndexRef.current >= sequence.length - 1) {
                requestRef.current = requestAnimationFrame(animate)
                return
            }

            const ctx = ctxRef.current
            const center = width / 2
            const radius = (width / 2) - 30

            ctx.lineWidth = 0.5
            ctx.strokeStyle = currentTheme.thread

            // Draw batch of lines based on speed
            for (let i = 0; i < speed; i++) {
                if (currentIndexRef.current >= sequence.length - 1) break

                const startNail = sequence[currentIndexRef.current]
                const endNail = sequence[currentIndexRef.current + 1]

                const startAngle = (2 * Math.PI * startNail) / nNails
                const endAngle = (2 * Math.PI * endNail) / nNails
                const startX = center + radius * Math.cos(startAngle)
                const startY = center + radius * Math.sin(startAngle)
                const endX = center + radius * Math.cos(endAngle)
                const endY = center + radius * Math.sin(endAngle)

                ctx.beginPath()
                ctx.moveTo(startX, startY)
                ctx.lineTo(endX, endY)
                ctx.stroke()

                currentIndexRef.current++
            }

            // Draw Numbers (Redraw every frame? No, better to draw on top or accept potential overlap)
            // Ideally, numbers should be drawn once. But threads will draw OVER them.
            // If we want numbers ON TOP, we must redraw them every frame or use a second canvas layer.
            // For simplicity, let's draw them at the end of every batch? No, expensive.
            // Let's draw them ONCE at the start, and let threads cover them (like real string art).
            // Actually user asked to "add numberings".

            setProgress(currentIndexRef.current)
            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(requestRef.current)
    }, [isPlaying, speed, sequence, nNails, width, currentTheme]) // Re-bind loop vars

    // Redraw numbers when toggled (Need to redraw whole scene to be clean, or just draw on top)
    useEffect(() => {
        const ctx = ctxRef.current
        if (!ctx) return

        // If we toggle numbers ON, we can just draw them.
        // If we toggle OFF, we have to redraw everything to clear them?
        // Let's just draw them on top for now. If toggled off -> re-render scene from scratch?
        // Simpler: Just handle it in the static draw or a dedicated overlay div?
        // Overlay div is safest for performance!

        // Let's use canvas for numbers for now, strictly on initialization or if explicit redraw needed.
        // Actually, let's stick to the user request.

        if (showNumbers) {
            const center = width / 2
            const radius = (width / 2) - 30
            const labelRadius = radius + 20

            ctx.fillStyle = currentTheme.text
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            for (let i = 0; i < nNails; i += 5) { // Every 5th
                const angle = (2 * Math.PI * i) / nNails
                const lx = center + labelRadius * Math.cos(angle)
                const ly = center + labelRadius * Math.sin(angle)

                ctx.save()
                ctx.translate(lx, ly)
                ctx.rotate(angle + Math.PI / 2)
                ctx.fillText(i.toString(), 0, 0)
                ctx.restore()
            }
        }
    }, [showNumbers, nNails, width, currentTheme])


    const togglePlay = () => setIsPlaying(!isPlaying)
    const restart = () => {
        currentIndexRef.current = 0
        setProgress(0)
        setIsPlaying(true)
        if (ctxRef.current) drawStaticElements(ctxRef.current)
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="relative aspect-square w-full max-w-[600px] mx-auto bg-black/40 rounded-full border border-white/10 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-sm">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={togglePlay}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/5"
                    >
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <button
                        onClick={restart}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/5"
                    >
                        ⏮ Restart
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Speed</span>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white transition-colors">
                        <input
                            type="checkbox"
                            checked={showNumbers}
                            onChange={(e) => setShowNumbers(e.target.checked)}
                            className="rounded border-white/20 bg-white/5 checked:bg-accent-primary"
                        />
                        Show Numbers
                    </label>
                </div>

                <div className="text-xs font-mono text-white/40 ml-auto">
                    {progress} / {sequence.length - 1} steps
                </div>
            </div>
        </div>
    )
}

export default StringArtCanvas
