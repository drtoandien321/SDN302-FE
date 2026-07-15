const fs = require('fs');
const path = require('path');

const mapping = {
    'X': 'X', 'Building2': 'Buildings', 'Wallet': 'Wallet', 'CreditCard': 'CreditCard',
    'MoreHorizontal': 'DotsThree', 'Utensils': 'ForkKnife', 'Car': 'Car', 'ShoppingBag': 'ShoppingBag',
    'FileText': 'FileText', 'Music': 'MusicNotes', 'Heart': 'Heart', 'GraduationCap': 'GraduationCap',
    'PiggyBank': 'PiggyBank', 'ShoppingCart': 'ShoppingCart', 'Coffee': 'Coffee', 'Home': 'House',
    'Wrench': 'Wrench', 'Fuel': 'GasPump', 'Navigation': 'NavigationArrow', 'Gamepad2': 'GameController',
    'Film': 'FilmStrip', 'BookOpen': 'BookOpen', 'Stethoscope': 'Stethoscope', 'Pill': 'Pill',
    'Lightbulb': 'Lightbulb', 'Zap': 'Lightning', 'Droplets': 'Drop', 'Phone': 'Phone',
    'Briefcase': 'Briefcase', 'Gift': 'Gift', 'TrendingUp': 'TrendUp', 'Users': 'Users',
    'HandCoins': 'Coins', 'Camera': 'Camera', 'AlertCircle': 'WarningCircle', 'Send': 'PaperPlaneRight',
    'Trash2': 'Trash', 'CheckCircle2': 'CheckCircle', 'XCircle': 'XCircle', 'HelpCircle': 'Question',
    'Sparkles': 'Sparkle', 'MessageSquare': 'ChatCircle', 'PlusCircle': 'PlusCircle', 'BarChart3': 'ChartBar',
    'Clock': 'Clock', 'Mic': 'Microphone', 'ImageIcon': 'Image', 'MoreVertical': 'DotsThreeVertical',
    'Edit2': 'PencilSimple', 'AlertTriangle': 'Warning', 'ChevronLeft': 'CaretLeft', 'ChevronRight': 'CaretRight',
    'Calendar': 'Calendar', 'Plus': 'Plus', 'Pencil': 'Pencil', 'Tag': 'Tag',
    'ArrowDownCircle': 'ArrowCircleDown', 'ArrowUpCircle': 'ArrowCircleUp', 'FolderOpen': 'FolderOpen',
    'User': 'User', 'DollarSign': 'CurrencyDollar', 'RefreshCcw': 'ArrowsClockwise', 'AlertOctagon': 'WarningOctagon',
    'Target': 'Target', 'ChevronDown': 'CaretDown', 'Bell': 'Bell', 'Landmark': 'Bank',
    'Trophy': 'Trophy', 'CalendarClock': 'Calendar', 'Lock': 'Lock', 'LogOut': 'SignOut',
    'Shield': 'Shield', 'ShieldCheck': 'ShieldCheck', 'Monitor': 'Monitor', 'LayoutDashboard': 'SquaresFour',
    'PieChart': 'ChartPie', 'Database': 'Database', 'TrendingDown': 'TrendDown', 'Moon': 'Moon',
    'Sun': 'Sun', 'Search': 'MagnifyingGlass', 'Filter': 'Faders', 'Edit': 'PencilSimple',
    'Package': 'Package', 'List': 'List', 'Table': 'Table', 'Receipt': 'Receipt',
    'ExternalLink': 'ArrowSquareOut', 'Upload': 'Upload', 'Table2': 'Table', 'Download': 'Download',
    'Settings': 'Gear', 'Save': 'FloppyDisk', 'FileSpreadsheet': 'FileXls', 'Copy': 'Copy',
    'Mail': 'Envelope', 'Eye': 'Eye', 'EyeOff': 'EyeClosed', 'ArrowLeft': 'ArrowLeft',
    'LineChart': 'ChartLine', 'Flame': 'Fire', 'ClipboardList': 'ClipboardText', 'Activity': 'Activity'
};

function processFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const newContent = content.replace(/import\s+\{([^}]+)\}\s+from\s+["']lucide-react["'];?/g, (match, importsStr) => {
        const newImports = [];
        importsStr.split(',').forEach(imp => {
            imp = imp.trim();
            if (!imp) return;
            const parts = imp.split(/\s+as\s+/);
            const originalName = parts[0].trim();
            const phosphorName = mapping[originalName] || originalName;
            
            if (parts.length === 2) {
                const alias = parts[1].trim();
                if (phosphorName === alias) {
                    newImports.push(phosphorName);
                } else {
                    newImports.push(`${phosphorName} as ${alias}`);
                }
            } else {
                if (phosphorName === originalName) {
                    newImports.push(phosphorName);
                } else {
                    newImports.push(`${phosphorName} as ${originalName}`);
                }
            }
        });
        return `import { ${newImports.join(', ')} } from "@phosphor-icons/react";`;
    });

    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log(`Updated ${filepath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

walkDir('src');
