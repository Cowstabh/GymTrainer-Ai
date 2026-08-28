const fs = require('fs');
let code = fs.readFileSync('app/dashboard/page.tsx', 'utf8');

// Remove the bad import
code = code.replace('import TacticalBriefing from "@/components/TacticalBriefing";\n\n', '');
code = code.replace('import TacticalBriefing from "@/components/TacticalBriefing";\n', '');
code = code.replace('import TacticalBriefing from "@/components/TacticalBriefing";', '');

// Add it near the top properly
const target = 'import { Dumbbell, Utensils, Activity, PowerOff, Zap } from "lucide-react";';
code = code.replace(target, target + '\nimport TacticalBriefing from "@/components/TacticalBriefing";');

fs.writeFileSync('app/dashboard/page.tsx', code);
