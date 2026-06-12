const EXERCISES = [
    {
        number: 1,
        name: "Boot Sequence - Stand up to stretch and move",
        subtitle: "Stand Up + Neck + Shoulders + Wrists",
        duration: 60,
        section: "🧘  BOOT SEQUENCE",
        emoji: "🚀",
        description: "1. Stand up 2. Neck — turn left/right 3. Shoulders — roll forward and backwards 4. Wrists — rotate, extend arm, pull fingers back."
    },
    {
        number: 2,
        name: "Clear Cache",
        subtitle: "Eye Break: 10-10-10",
        duration: 15,
        section: "🧘  BOOT SEQUENCE",
        emoji: "👁️",
        description: "Close eyes for 10 seconds. Open, focus on something 20 feet away for 10 seconds. Repeat 3 times. Flush the pixel buffer. Reduce eye strain before it becomes a bug."
    },
    {
        number: 3,
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
        description: "Inhale 4 sec → hold 4 sec → exhale 7 sec. Clear the stack. Free the memory. Reduce cognitive load before the next sprint."
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
        name: "Lint Your Posture - Shoulder Rolls",
        subtitle: "Posture Check",
        duration: 20,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "✅",
        description: "Ears over shoulders. Shoulders back and down. Screen at eye level. Feet flat on floor. Hold this correct posture for 20 sec. Run the linter. Fix the warnings. Zero errors."
    },
    {
        number: 11,
        name: "git remove pee && git add water",
        subtitle: "Hydration Reminder",
        duration: 15,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "💧",
        description: "Go pee and drink water. Right now. Seriously. git commit -m 'stay hydrated' && git push. Your brain is 75% water and you have not been watering it. This commit is non-negotiable."
    },
    {
        number: 12,
        name: "Full Stack Reach with Deep Squat Rotation",
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
        name: "Spider Crawl Protocol",
        subtitle: "Quadruped Hold",
        duration: 30,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "🕷️",
        description: "Hands and knees on the floor — wrists under shoulders, knees under hips. Back flat like a table, no sagging. Hold 30 sec breathing steadily. For extra credit: extend opposite arm and leg and hold 5 sec each side. Your core infrastructure needs as much maintenance as your codebase."
    },
    {
        number: 16,
        name: "Cat Stretch Protocol",
        subtitle: "Cat, Cat-Cow Stretch",
        duration: 30,
        section: "🦴  BACKEND MAINTENANCE",
        emoji: "😸",
        description: "Well, Cat stretch: on all fours, round your back up like a cat. Hold 5 sec. Then Cow stretch: drop belly down, lift chest and tailbone up. Hold 5 sec. Your backend systems need regular stretching to prevent stiffness and downtime."
    },
    {
        number: 17,
        name: "git pull fresh air",
        subtitle: "Breath of Fresh Air",
        duration: 30,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "😮‍💨",
        description: "Step outside or open a window. Take 3 deep breaths of fresh air. Inhale the new ideas, exhale the stress and fatigue. A breath of fresh air can be the best commit message for your mental state."
    },
    {
        number: 18,
        name: "Commiting Protocol - Time to commit more work?!",
        subtitle: "Time to commit more work?!",
        duration: 30,
        section: "🧘  SHUTDOWN SEQUENCE",
        emoji: "👨‍💻",
        description: "Time to commit more work?! Take a moment to reflect on what you've accomplished. Celebrate the wins, no matter how small. Then, if you have the energy, plan your next commit. But remember, it's okay to push an empty commit just to acknowledge the hard work you've done."
    }
];

const SETS = [

    { number: 1, name: "Building", exercises: [2, 3, 9, 10, 11, 8, 17, 18] },
    { number: 2, name: "Committing", exercises: [2, 1, 9, 12, 15, 16, 11, 17, 18] },
    { number: 3, name: "Introspection", exercises: [2, 11, 8, 17, 18] },
    { number: 4, name: "Pushing", exercises: [1, 2, 12, 13, 14, 16, 11, 7] },
];
