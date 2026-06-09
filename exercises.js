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
        duration: 60,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🔄",
        description: "Roll shoulders forward 8 times, then backward 8 times. git revert for your upper body. 2 sets. Release the tension from those unreviewed PRs."
    },
    {
        number: 3,
        name: "Prevent Carpal Tunnel PR",
        subtitle: "Wrist Stretches",
        duration: 60,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🖐️",
        description: "Extend arm forward, gently pull fingers back. Hold 20 sec per wrist. Then rotate wrists in circles. This is the most important PR you will merge today. No skipping."
    },
    {
        number: 4,
        name: "Deploy to Standing Position",
        subtitle: "Sit to Stand",
        duration: 40,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🚀",
        description: "Stand up from your chair slowly without using your hands. Sit back down. Repeat. 2 sets × 10 reps. Your body needs to ship to production too. Zero downtime deployment."
    },
    {
        number: 5,
        name: "Clear Cache",
        subtitle: "Eye Break: 10-10-10",
        duration: 60,
        section: "👁️  VISUAL REFRESH",
        emoji: "👁️",
        description: "Close eyes for 10 seconds. Open, focus on something 20 feet away for 10 seconds. Repeat 3 times. Flush the pixel buffer. Reduce eye strain before it becomes a bug."
    },
    {
        number: 6,
        name: "Refactor Your Spine",
        subtitle: "Seated Back Twist",
        duration: 60,
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
        duration: 40,
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
        duration: 40,
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
        name: "Building the Core",
        subtitle: "Squats",
        duration: 40,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🦵",
        description: "Stand with feet shoulder-width apart. Lower into a squat as if sitting back into a chair. Keep chest up and knees over toes. Rise back up. 2 sets × 15 reps. Strengthen the core of your body and your codebase."
    },
    {
        number: 14,
        name: "Building the Core",
        subtitle: "Planks",
        duration: 40,
        section: "⚙️  CORE SYSTEMS",
        emoji: "🏋️",
        description: "Forearms on the ground, body in a straight line from head to heels. Engage your core and hold. 3 sets × 30 sec. Strengthen the core of your body and your codebase."
    },
    {
        number: 15,
        name: "Crawl Protocol",
        subtitle: "Quadruped Hold",
        duration: 45,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "🕷️",
        description: "Hands and knees on the floor — wrists under shoulders, knees under hips. Back flat like a table, no sagging. Hold 30 sec breathing steadily. For extra credit: extend opposite arm and leg and hold 5 sec each side. Your core infrastructure needs as much maintenance as your codebase."
    }
];

const SETS = [
    // ~8 min  — lightest; gentle upper-body warm-up, no demanding Core Systems exercises
    { number: 1, name: "Building",   exercises: [1, 2, 3, 5, 6, 8, 10, 11] },
    // ~7 min  — moderate; sit-to-stand, deep squat rotation, quadruped, breathing
    { number: 2, name: "Committing", exercises: [4, 5, 12, 15, 8, 9, 11]   },
    // ~12 min — hardest; eye reset → warmup → 4-min walk → squat rotation → squats → planks → recovery
    { number: 3, name: "Pushing",    exercises: [5, 4, 7, 12, 13, 14, 8, 9, 11] },
];
