import { motion } from "motion/react";

interface SpaceshipSpeedIndicatorProps {
  completionTime: string;
}

export function SpaceshipSpeedIndicator({
  completionTime,
}: SpaceshipSpeedIndicatorProps) {
  return (
    <motion.div
      className="relative shrink-0 overflow-hidden rounded-lg bg-gradient-to-r from-background/80 to-background/60 px-6 py-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}>
      {/* Deep space background with twinkling stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-primary/40"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            top: `${Math.random() * 100}%`,
            right: `${Math.random() * 90 + 10}%`,
          }}
          animate={{
            x: [-120, -300 - Math.random() * 150],
            opacity: [0, 1, 0.3, 0],
            scale: [0, 1.2, 0.8, 0],
          }}
          transition={{
            delay: 0.3 + Math.random() * 1,
            duration: 2 + Math.random() * 1.5,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: Math.random() * 4,
          }}
        />
      ))}

      {/* High-speed particle stream */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-primary/30"
          style={{
            width: 1 + Math.random() * 4,
            height: 0.5 + Math.random() * 1,
            top: `${35 + Math.random() * 30}%`,
            right: `${Math.random() * 70}%`,
          }}
          animate={{
            x: [-100, -250 - Math.random() * 100],
            opacity: [0, 0.9, 0.4, 0],
            scaleX: [1, 0.2, 0.05],
            scaleY: [1, 1.5, 0.8],
          }}
          transition={{
            delay: 0.4 + i * 0.02,
            duration: 1.2 + Math.random() * 0.8,
            ease: "easeOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0.3 + Math.random() * 0.7,
          }}
        />
      ))}

      {/* Hyperspeed streaks */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`streak-${i}`}
          className="absolute h-px bg-gradient-to-l from-primary/60 via-primary/40 to-transparent"
          style={{
            top: `${42 + i * 4}%`,
            right: "55%",
            width: 60 + i * 25,
          }}
          animate={{
            x: [-80, -180],
            opacity: [0, 1, 0.3, 0],
            scaleX: [0, 1.5, 0.3],
          }}
          transition={{
            delay: 0.3 + i * 0.05,
            duration: 1.5,
            ease: "easeOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0.8 + i * 0.2,
          }}
        />
      ))}

      {/* Warp distortion field */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
        animate={{
          x: [-200, 200],
          opacity: [0, 0.8, 0],
          scaleX: [0.5, 2, 0.5],
        }}
        transition={{
          delay: 0.6,
          duration: 3,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 4,
        }}
      />

      {/* The Spaceship Core - Just the text floating */}
      <motion.div
        className="relative z-20 flex items-center justify-center"
        initial={{ x: -80, opacity: 0 }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        transition={{
          delay: 0.4,
          duration: 1,
          ease: "easeOut",
        }}>
        {/* Energy field around text */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 blur-md"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1.2, 0.9],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />

        {/* Air slicing effects cutting through the text area */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`air-slice-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            style={{
              top: `${20 + i * 10}%`,
              left: "10%",
              width: "80%",
              transform: `rotate(${(Math.random() - 0.5) * 10}deg)`,
            }}
            animate={{
              x: [0, 30, 60],
              opacity: [0, 0.8, 0],
              scaleX: [0.3, 1, 2],
            }}
            transition={{
              delay: 0.5 + i * 0.03,
              duration: 0.8,
              ease: "easeOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 2 + Math.random() * 1,
            }}
          />
        ))}

        {/* Air displacement particles around text */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`air-displacement-${i}`}
            className="absolute size-1 rounded-full bg-primary/30"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              x: [0, -40 - Math.random() * 30],
              y: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60],
              opacity: [0, 0.7, 0],
              scale: [0.3, 1, 0.2],
            }}
            transition={{
              delay: 0.4 + Math.random() * 0.3,
              duration: 1.2 + Math.random() * 0.8,
              ease: "easeOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: Math.random() * 2,
            }}
          />
        ))}

        {/* Thruster particles positioned right before the text */}
        <motion.div
          className="-ml-32 -translate-y-1/2 absolute top-1/2 left-1/2 h-4 w-12"
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}>
          {/* Main thruster flame */}
          <motion.div
            className="-translate-y-1/2 absolute top-1/2 right-0 h-3 w-8 rounded-l-full bg-gradient-to-l from-warning via-orange-400 to-red-500"
            animate={{
              scaleX: [0.7, 1.3, 0.7],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          {/* Hot core */}
          <motion.div
            className="-translate-y-1/2 absolute top-1/2 right-0 h-1 w-6 rounded-l-full bg-gradient-to-l from-yellow-200 via-white to-yellow-300"
            animate={{
              scaleX: [0.5, 1.5, 0.5],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          {/* Thruster particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`thruster-particle-${i}`}
              className="absolute size-1 rounded-full bg-warning/60"
              style={{
                top: `${30 + Math.random() * 40}%`,
                right: `${Math.random() * 20}%`,
              }}
              animate={{
                x: [0, -20 - Math.random() * 15],
                y: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20],
                opacity: [1, 0.3, 0],
                scale: [0.8, 0.3, 0.1],
              }}
              transition={{
                delay: Math.random() * 0.3,
                duration: 0.6 + Math.random() * 0.4,
                ease: "easeOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: Math.random() * 0.5,
              }}
            />
          ))}
        </motion.div>

        {/* Speed readout text - no container, just floating */}
        <motion.p
          className="relative z-10 font-bold text-lg text-primary"
          animate={{
            textShadow: [
              "0 0 15px var(--primary)",
              "0 0 30px var(--primary)",
              "0 0 15px var(--primary)",
            ],
            x: [0, -1, 1, 0],
          }}
          transition={{
            textShadow: {
              duration: 2,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            },
            x: {
              duration: 0.1,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            },
          }}>
          {completionTime}
        </motion.p>

        {/* Air compression waves around text */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`compression-${i}`}
            className="absolute inset-0 rounded-lg border border-primary/20"
            animate={{
              scale: [1, 1.2 + i * 0.1],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1.5 + i * 0.3,
              ease: "easeOut",
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Sonic boom effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          animate={{
            x: [-50, 50],
            opacity: [0, 0.6, 0],
            scaleY: [0.5, 1.5, 0.5],
          }}
          transition={{
            delay: 0.8,
            duration: 0.8,
            ease: "easeOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 3,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
