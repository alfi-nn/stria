import React, { useState, useEffect, useRef } from 'react';

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

const PixelText = ({ text, className = '' }) => {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef(null);
    const iterationsRef = useRef(0);

    const animate = () => {
        let iterations = 0;
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(prev =>
                text.split('').map((letter, index) => {
                    if (index < iterations) {
                        return text[index];
                    }
                    return characters[Math.floor(Math.random() * characters.length)];
                }).join('')
            );

            if (iterations >= text.length) {
                clearInterval(intervalRef.current);
            }

            iterations += 1 / 3; // Adjust speed here (lower = slower)
        }, 30);
    };

    useEffect(() => {
        animate();
        return () => clearInterval(intervalRef.current);
    }, [text]);

    return (
        <span
            className={`${className} inline-block cursor-default`}
            onMouseEnter={animate}
        >
            {displayText}
        </span>
    );
};

export default PixelText;
