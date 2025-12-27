'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useVoiceAssistant } from '@livekit/components-react';
import { motion } from 'motion/react';

// Model URLs - verified working from pixi-live2d-display examples
const MODELS = {
    haru: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
    shizuku: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
};

interface Live2DAvatarProps {
    modelType?: 'haru' | 'shizuku';
    width?: number;
    height?: number;
    showStatus?: boolean;
}

export default function Live2DAvatar({
    modelType = 'haru',
    width = 400,
    height = 500,
    showStatus = true
}: Live2DAvatarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<any>(null);
    const modelRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const { state: agentState } = useVoiceAssistant();

    // Initialize PixiJS and Live2D
    useEffect(() => {
        let mounted = true;
        let app: any = null;

        const initLive2D = async () => {
            if (!canvasRef.current || !mounted) return;

            try {
                console.log('[Live2D] Starting initialization...');

                // Wait for Cubism 4 Core SDK to be loaded from page head
                let waitAttempts = 0;
                while (!(window as any).Live2DCubismCore && waitAttempts < 50) {
                    console.log('[Live2D] Waiting for Cubism Core...', waitAttempts);
                    await new Promise(r => setTimeout(r, 100));
                    waitAttempts++;
                }

                if (!(window as any).Live2DCubismCore) {
                    throw new Error('Cubism 4 Core not loaded after 5 seconds');
                }

                console.log('[Live2D] Cubism Core ready!');

                // Dynamic imports for client-side only
                const PIXI = await import('pixi.js');

                // Register PIXI globally for pixi-live2d-display
                (window as any).PIXI = PIXI;

                // Import Cubism 4 specific module (for .model3.json files)
                const { Live2DModel } = await import('pixi-live2d-display/cubism4');

                // Register the ticker for animation updates
                Live2DModel.registerTicker(PIXI.Ticker);

                console.log('[Live2D] Creating PIXI Application...');

                // Create PIXI Application
                app = new PIXI.Application({
                    view: canvasRef.current,
                    width,
                    height,
                    backgroundAlpha: 0,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });

                appRef.current = app;

                // Load the model
                const modelUrl = MODELS[modelType];
                console.log('[Live2D] Loading model:', modelUrl);

                const model = await Live2DModel.from(modelUrl, {
                    autoInteract: true,
                    autoUpdate: true,
                });

                if (!mounted) {
                    console.log('[Live2D] Component unmounted during load');
                    model.destroy();
                    return;
                }

                modelRef.current = model;
                console.log('[Live2D] Model loaded, dimensions:', model.width, 'x', model.height);

                // Scale and position the model to fit the container
                const scale = Math.min(width / model.width, height / model.height) * 0.9;
                model.scale.set(scale);
                model.anchor.set(0.5, 0.5);
                model.x = width / 2;
                model.y = height / 2 + 20;

                // Add to stage
                app.stage.addChild(model);

                // Try to start idle animation
                try {
                    const motionManager = model.internalModel?.motionManager;
                    if (motionManager) {
                        // Start with idle or greeting motion
                        model.motion('idle');
                    }
                } catch (e) {
                    console.log('[Live2D] Default motion not available:', e);
                }

                setIsLoaded(true);
                setIsInitializing(false);
                console.log('[Live2D] Initialization complete!');

            } catch (error) {
                console.error('[Live2D] Failed to initialize:', error);
                if (mounted) {
                    setLoadError(error instanceof Error ? error.message : 'Failed to load avatar');
                    setIsInitializing(false);
                }
            }
        };

        initLive2D();

        return () => {
            mounted = false;
            if (modelRef.current) {
                try {
                    modelRef.current.destroy();
                } catch (e) {
                    console.log('[Live2D] Cleanup error:', e);
                }
            }
            if (app) {
                try {
                    app.destroy(true, { children: true });
                } catch (e) {
                    console.log('[Live2D] App cleanup error:', e);
                }
            }
        };
    }, [modelType, width, height]);

    // React to agent state changes
    useEffect(() => {
        if (!modelRef.current || !isLoaded) return;

        const model = modelRef.current;

        try {
            if (agentState === 'speaking') {
                // Trigger speaking motion/expression
                model.expression?.('f01');
                model.motion?.('tap_body', 0);
            } else if (agentState === 'thinking') {
                model.expression?.('f02');
            } else if (agentState === 'listening') {
                model.expression?.('f00');
                model.motion?.('idle', 0);
            }
        } catch (e) {
            // Motions/expressions may not exist for all models
        }
    }, [agentState, isLoaded]);

    // Get status text
    const getStatusText = () => {
        if (isInitializing) return 'Loading...';
        if (loadError) return 'Error';
        switch (agentState) {
            case 'speaking': return '💬 Speaking...';
            case 'thinking': return '🤔 Thinking...';
            case 'listening': return '👂 Listening...';
            case 'connecting': return '⏳ Connecting...';
            default: return '✨ Ready';
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col items-center justify-center"
        >
            {/* Glow background */}
            <motion.div
                className="absolute inset-[-30px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
                    filter: 'blur(20px)'
                }}
                animate={{
                    opacity: agentState === 'speaking' ? [0.4, 0.7, 0.4] : 0.3,
                    scale: agentState === 'speaking' ? [1, 1.05, 1] : 1
                }}
                transition={{
                    duration: agentState === 'speaking' ? 0.5 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Canvas container */}
            <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                    width,
                    height,
                    background: 'linear-gradient(180deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)'
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ width, height }}
                />

                {/* Loading overlay */}
                {isInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                        <span className="text-purple-300 text-sm">Loading avatar...</span>
                    </div>
                )}

                {/* Error state */}
                {loadError && !isInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                        <span className="text-5xl mb-4">😔</span>
                        <span className="text-gray-300 text-sm mb-2">Avatar loading failed</span>
                        <span className="text-gray-500 text-xs max-w-[80%] text-center">{loadError}</span>
                    </div>
                )}
            </div>

            {/* Status badge */}
            {showStatus && (
                <motion.div
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-lg border border-purple-500/30 rounded-full shadow-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span
                        className={`w-2 h-2 rounded-full ${agentState === 'speaking' ? 'bg-pink-500 animate-pulse' :
                            agentState === 'thinking' ? 'bg-purple-500 animate-pulse' :
                                agentState === 'listening' ? 'bg-green-500' :
                                    agentState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                        'bg-gray-500'
                            }`}
                    />
                    <span className="text-sm font-medium text-white">{getStatusText()}</span>
                </motion.div>
            )}
        </div>
    );
}

export { Live2DAvatar };
