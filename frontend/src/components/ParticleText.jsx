import React, { useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

const ParticleText = ({ text = "Stria", height = 300, isExploding = false }) => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    // Store particles in a ref so they persist across renders without re-initialization
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const getResponsiveFontSize = () => {
            const width = window.innerWidth;
            if (width >= 1024) return 160; // lg:text-[10rem]
            if (width >= 768) return 128;  // md:text-9xl
            return 96;                     // text-8xl
        };

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = height;
            }
        };

        class Particle {
            constructor(x, y, color) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;

                // Target position (final text position)
                this.targetX = x;
                this.targetY = y;

                this.color = color;
                this.size = 2;

                // Assembly speed (Slower)
                this.speed = Math.random() * 0.04 + 0.01;

                // Explosion velocities (Slower)
                this.vx = (Math.random() - 0.5) * 6; // Reduced scatter speed
                this.vy = (Math.random() - 0.5) * 6;
                this.alpha = 1; // Opacity
            }

            update(exploding) {
                if (exploding) {
                    // Explosion physics
                    this.x += this.vx;
                    this.y += this.vy;
                    this.alpha -= 0.008; // Slower fade out

                    // Gravity/Momentum effect (Reduced)
                    this.vy += 0.05;
                } else {
                    // Assembly physics
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    this.x += dx * this.speed;
                    this.y += dy * this.speed;
                }
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.alpha);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.size, this.size);
                ctx.restore();
            }
        }

        const init = () => {
            if (particlesRef.current.length > 0) return; // Don't re-init if particles exist

            resize();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Text to get pixel data
            const fontSize = getResponsiveFontSize();
            ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
            ctx.letterSpacing = "5px";
            ctx.fillStyle = theme === 'dark' ? 'white' : '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);

            // 2. Scan pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const newParticles = [];
            const step = 4;

            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const index = (y * canvas.width + x) * 4;
                    const alpha = data[index + 3];

                    if (alpha > 128) {
                        const red = data[index];
                        const green = data[index + 1];
                        const blue = data[index + 2];
                        const color = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
                        newParticles.push(new Particle(x, y, color));
                    }
                }
            }
            particlesRef.current = newParticles;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach(particle => {
                particle.update(isExploding); // Pass exploding state
                particle.draw();
            });

            // If exploding and all particles faded, stop? (Optional optimization)
            animationFrameId = requestAnimationFrame(animate);
        };

        // Handle Font Loading
        document.fonts.ready.then(() => {
            init();
            animate();
        });

        window.addEventListener('resize', () => {
            particlesRef.current = []; // Force re-init on resize
            init();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', init);
        };
    }, [text, theme, height, isExploding]); // Depend on isExploding to trigger updates logic

    return (
        <canvas
            ref={canvasRef}
            className="w-full pointer-events-none"
            style={{ height: height }}
        />
    );
};

export default ParticleText;
