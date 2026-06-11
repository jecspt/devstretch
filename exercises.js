const EXERCISES = [
    {
        number: 1,
        name: "Review That Code",
        subtitle: "Neck Stretch",
        duration: 30,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🔍",
        description: "Turn your head slowly left and right, like reviewing code across two monitors. Hold 3 sec each side. 5 reps. Your neck has been staring at one angle for too long."
    },
    {
        number: 2,
        name: "Roll Back",
        subtitle: "Shoulder Rolls",
        duration: 30,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🔄",
        description: "Roll shoulders forward 8 times, then backward 8 times. git revert for your upper body. 2 sets. Release the tension from those unreviewed PRs."
    },
    {
        number: 3,
        name: "Prevent Carpal Tunnel PR",
        subtitle: "Wrist Stretches",
        duration: 30,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🖐️",
        description: "Extend arm forward, gently pull fingers back. Hold 20 sec per wrist. Then rotate wrists in circles. This is the most important PR you will merge today. No skipping."
    },
    {
        number: 4,
        name: "Deploy to Standing Position",
        subtitle: "Sit to Stand",
        duration: 30,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🚀",
        description: "Stand up from your chair slowly without using your hands. Your body needs to ship to production too. Zero downtime deployment."
    },
    {
        number: 5,
        name: "Clear Cache",
        subtitle: "Eye Break: 10-10-10",
        duration: 15,
        section: "👁️  VISUAL REFRESH",
        emoji: "👁️",
        description: "Close eyes for 10 seconds. Open, focus on something 20 feet away for 10 seconds. Repeat 3 times. Flush the pixel buffer. Reduce eye strain before it becomes a bug."
    },
    {
        number: 6,
        name: "Refactor Your Spine",
        subtitle: "Seated Back Twist",
        duration: 30,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "🌀",
        description: "Seated tall, twist your torso gently left. Hold 5 sec. Then right. Hold 5 sec. 6 reps per side. Your spine's architecture needs refactoring after hours of hunching."
    },
    {
        number: 7,
        name: "Offline Mode",
        subtitle: "Walk Away",
        duration: 240,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "🚶",
        description: "Step away from the screen. Walk around: kitchen, hallway, outside if possible. No phone. No Slack. You are temporarily offline. This is a feature, not a bug. Enjoy it."
    },
    {
        number: 8,
        name: "Memory Garbage Collection",
        subtitle: "Box Breathing",
        duration: 120,
        section: "🧠  PROCESS MANAGEMENT",
        emoji: "💨",
        description: "Inhale 4 sec → hold 4 sec → exhale 6 sec → hold 2 sec. 2 sets × 6 cycles. Clear the stack. Free the memory. Reduce cognitive load before the next sprint."
    },
    {
        number: 9,
        name: "Extend Your Reach",
        subtitle: "Overhead Arm Stretch",
        duration: 30,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "🙌",
        description: "Reach both arms overhead, interlace fingers, stretch tall. Lean gently side to side. 20 sec each direction. Extending your physical API endpoints after a long session."
    },
    {
        number: 10,
        name: "Lint Your Posture",
        subtitle: "Posture Check",
        duration: 20,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "✅",
        description: "Ears over shoulders. Shoulders back and down. Screen at eye level. Feet flat on floor. Hold this correct posture for 20 sec. Run the linter. Fix the warnings. Zero errors."
    },
    {
        number: 11,
        name: "git commit --water",
        subtitle: "Hydration Reminder",
        duration: 15,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "💧",
        description: "Drink water. Right now. Seriously. git commit -m 'stay hydrated' && git push. Your brain is 75% water and you have not been watering it. This commit is non-negotiable."
    },
    {
        number: 12,
        name: "Full Stack Reach",
        subtitle: "Deep Squat Rotation",
        duration: 50,
        section: "⚙️  CORE SYSTEMS",
        emoji: "📡",
        description: "Feet wide, drop into a deep squat. Place one hand on the ground, reach the other arm straight up while rotating your chest toward the ceiling. Hold 5 sec. Switch sides. 5 reps each. Full-stack mobility — from the lowest layer all the way to the top of the architecture."
    },
    {
        number: 13,
        name: "Building the Core - Squats",
        subtitle: "Squats",
        duration: 40,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🦵",
        description: "Stand with feet shoulder-width apart. Lower into a squat as if sitting back into a chair. Keep chest up and knees over toes. Rise back up. 2 sets × 15 reps. Strengthen the core of your body and your codebase."
    },
    {
        number: 14,
        name: "Building the Core - Planks",
        subtitle: "Planks",
        duration: 60,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🏋️",
        description: "Forearms on the ground, body in a straight line from head to heels. Engage your core and hold. 3 sets × 30 sec. Strengthen the core of your body and your codebase."
    },
    {
        number: 15,
        name: "Crawl Protocol",
        subtitle: "Quadruped Hold",
        duration: 30,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "🕷️",
        description: "Hands and knees on the floor — wrists under shoulders, knees under hips. Back flat like a table, no sagging. Hold 30 sec breathing steadily. For extra credit: extend opposite arm and leg and hold 5 sec each side. Your core infrastructure needs as much maintenance as your codebase."
    },
    {
        number: 17,
        name: "Boot Sequence",
        subtitle: "Stand Up + Neck + Shoulders + Wrists",
        duration: 80,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "🚀",
        description: "0–20s: Stand up — no hands. 20–40s: Neck — turn left/right, hold 3s each side. 40–60s: Shoulders — roll forward 5×, back 5×. 60–80s: Wrists — extend arm, pull fingers back 10s per hand."
    },
    {
        number: 16,
        name: "Stretch Protocol",
        subtitle: "Cat, Cat-Cow Stretch",
        duration: 30,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "😸",
        description: "Well, Cat stretch: on all fours, round your back up like a cat. Hold 5 sec. Then Cow stretch: drop belly down, lift chest and tailbone up. Hold 5 sec. Your backend systems need regular stretching to prevent stiffness and downtime."
    }
];

const SETS = [
    // ~8 min  — lightest; gentle upper-body warm-up, no demanding Core Systems exercises
    { number: 1, name: "Building",   exercises: [5, 17, 6, 8, 10, 11] },
    // ~7 min  — moderate; boot sequence, eye reset, deep squat rotation, quadruped, breathing
    { number: 2, name: "Committing", exercises: [5, 17, 9, 12, 15, 16, 11] },
    // ~11 min — hardest; boot sequence → eye reset → squat rotation → squats → planks → breathing → stretch → water → 4-min walk
    { number: 3, name: "Pushing",    exercises: [17, 5, 12, 13, 14, 16, 11, 7] },
];
