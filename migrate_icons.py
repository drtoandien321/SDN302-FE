import os
import re

mapping = {
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
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all lucide-react imports
    def replacer(match):
        imports_str = match.group(1)
        new_imports = []
        for imp in imports_str.split(','):
            imp = imp.strip()
            if not imp: continue
            
            parts = imp.split(' as ')
            original_name = parts[0].strip()
            
            phosphor_name = mapping.get(original_name, original_name)
            
            if len(parts) == 2:
                alias = parts[1].strip()
                if phosphor_name == alias:
                    new_imports.append(f'{phosphor_name}')
                else:
                    new_imports.append(f'{phosphor_name} as {alias}')
            else:
                if phosphor_name == original_name:
                    new_imports.append(f'{phosphor_name}')
                else:
                    new_imports.append(f'{phosphor_name} as {original_name}')
                    
        return f'import {{ {", ".join(new_imports)} }} from "@phosphor-icons/react";'

    new_content = re.sub(r'import\s+\{([^}]+)\}\s+from\s+[\"\']lucide-react[\"\'];?', replacer, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            process_file(os.path.join(root, file))
