import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    Zap,
    Globe,
    Bell,
    Smartphone,
    Shield,
    Eye,
    RefreshCw,
    Cloud,
    Rocket,
    Layout
} from "lucide-react";

const features = [
    {
        title: "Offline Caching",
        desc: "Automatically cache critical assets using custom service worker strategies for instant loading.",
        icon: Zap,
        color: "var(--neon-cyan)",
        gradient: "from-cyan-400 to-blue-500",
    },
    {
        title: "Web Push Notifications",
        desc: "Send standard Web Push notifications to keep users engaged even when the APK is closed.",
        icon: Bell,
        color: "var(--neon-violet)",
        gradient: "from-purple-400 to-indigo-500",
    },
    {
        title: "Web App Manifest",
        desc: "Generate complete webmanifest configuration with standalone display mode and theme styling.",
        icon: Smartphone,
        color: "var(--neon-cyan)",
        gradient: "from-blue-400 to-emerald-500",
    },
    {
        title: "Mobile Installable",
        desc: "Fully compliant with Google Chrome, Safari, and Firefox installation criteria for home screen presence.",
        icon: Shield,
        color: "var(--neon-violet)",
        gradient: "from-indigo-400 to-purple-600",
    },
    {
        title: "Real-time Previews",
        desc: "Visualize your website in a device mockup instantly as you configure manifest colors and settings.",
        icon: Eye,
        color: "var(--neon-pink)",
        gradient: "from-orange-400 to-red-500",
    },
    {
        title: "Automated Updates",
        desc: "Deliver updates instantly whenever your main website changes without repackaging the app.",
        icon: RefreshCw,
        color: "var(--neon-cyan)",
        gradient: "from-teal-400 to-cyan-500",
    },
    {
        title: "Instant Bundler",
        desc: "Generate a deploy-ready APK package ZIP containing manifest, sw, index, and resized icons in seconds.",
        icon: Cloud,
        color: "var(--neon-violet)",
        gradient: "from-violet-400 to-fuchsia-500",
    },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className="relative group"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition duration-500 blur-xl group-hover:duration-200"
                style={{ backgroundImage: `linear-gradient(to right, ${feature.color}, transparent)` }}></div>

            <div className="relative glass rounded-2xl p-6 sm:p-8 h-full flex flex-col border border-border/40 overflow-hidden">
                {/* Animated Background Mesh */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700"></div>

                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.gradient} shadow-lg relative z-10`}
                    style={{ transform: "translateZ(50px)" }}
                >
                    <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h3
                    className="text-xl font-display font-bold mb-3 text-foreground group-hover:text-accent transition-colors relative z-10"
                    style={{ transform: "translateZ(30px)" }}
                >
                    {feature.title}
                </h3>

                <p
                    className="text-muted-foreground text-sm leading-relaxed relative z-10"
                    style={{ transform: "translateZ(20px)" }}
                >
                    {feature.desc}
                </p>

                {/* Card Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full rotate-45 pointer-events-none"></div>
            </div>
        </motion.div>
    );
};

export const Features = () => {
    return (
        <section className="py-32 relative overflow-hidden grid-bg">
            {/* Decorative Orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-violet/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-6 border-border/40"
                    >
                        <span className="h-2 w-2 rounded-full bg-accent neon-glow-cyan animate-pulse" />
                        <span className="text-accent font-semibold tracking-wider uppercase">Native Capabilities</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-5xl md:text-7xl font-display font-bold mb-8"
                    >
                        Pure Native,<br />
                        <span className="gradient-text">Zero Compromise</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed"
                    >
                        Transform your web experience into a high-performance, installable mobile APK. 
                        Our engine generates standards-compliant offline caching and manifests in seconds.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1000">
                    {features.map((feature, index) => (
                        <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};
